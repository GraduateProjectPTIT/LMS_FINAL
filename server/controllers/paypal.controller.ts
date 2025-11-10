import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";
import NotificationModel from "../models/notification.model";
import sendMail from "../utils/sendMail";
import paypalClient, { paypal } from "../utils/paypal";
import CartModel from "../models/cart.model";
import mongoose from "mongoose";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import { createAndSendNotification } from "../services/notification.service";

export const createPayPalCheckoutSession = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, courseIds } = req.body as {
        courseId?: string;
        courseIds?: string[];
      };
      const userId = req.user?._id;

      if (!courseId && (!Array.isArray(courseIds) || courseIds.length === 0)) {
        return next(new ErrorHandler("Course ID(s) is required", 400));
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const targetCourseIds: string[] = courseId
        ? [courseId]
        : Array.from(new Set((courseIds as string[]).filter(Boolean)));

      const courses = await CourseModel.find({ _id: { $in: targetCourseIds } });
      if (!courses || courses.length === 0) {
        return next(new ErrorHandler("Course(s) not found", 404));
      }
      const foundIds = new Set(courses.map((c) => String((c as any)._id)));
      const missing = targetCourseIds.filter((id) => !foundIds.has(String(id)));
      if (missing.length > 0) {
        return next(
          new ErrorHandler(`Course(s) not found: ${missing.join(", ")}`, 404)
        );
      }

      const existingEnrollments = await EnrolledCourseModel.find({
        userId,
        courseId: { $in: targetCourseIds },
      }).select("courseId");
      const alreadyEnrolledIds = new Set(
        existingEnrollments.map((e: any) => String(e.courseId))
      );
      const purchasableCourses = courses.filter(
        (c: any) => !alreadyEnrolledIds.has(String(c._id))
      );

      if (purchasableCourses.length === 0) {
        return next(
          new ErrorHandler(
            "You have already purchased all selected courses",
            400
          )
        );
      }

      const totalAmount = purchasableCourses.reduce(
        (sum: number, c: any) => sum + Number(c.price || 0),
        0
      );
      const isMulti = purchasableCourses.length > 1;

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: totalAmount.toFixed(2),
            },
            description: isMulti
              ? `${purchasableCourses.length} courses purchase`
              : purchasableCourses[0].name,
            custom_id: isMulti
              ? "multi_courses"
              : String((purchasableCourses[0] as any)._id),
            reference_id: userId?.toString(),
          },
        ],
        application_context: {
          return_url: isMulti
            ? `${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/payment-success?courseIds=${encodeURIComponent(
                purchasableCourses.map((c: any) => String(c._id)).join(",")
              )}`
            : `${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/payment-success?courseId=${String(
                (purchasableCourses[0] as any)._id
              )}`,
          cancel_url: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/courses?canceled=true`,
          brand_name: "LMS Platform",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      });

      try {
        const order = await paypalClient.execute(request);

        console.log("PayPal order created:", order.result.id);

        res.status(200).json({
          success: true,
          orderId: order.result.id,
          courses: purchasableCourses.map((c: any) => ({
            id: c._id,
            name: c.name,
            price: c.price,
            description: c.description,
          })),
          totalAmount,
          paypalLinks: order.result.links,
        });
      } catch (error: any) {
        console.error("PayPal order creation error:", error);
        if (error.statusCode === 400) {
          return next(
            new ErrorHandler(
              "Invalid PayPal request. Please check course price and details.",
              400
            )
          );
        }
        return next(
          new ErrorHandler(
            "Failed to create PayPal order. Please try again.",
            500
          )
        );
      }
    } catch (error: any) {
      console.error("Create checkout session error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const paypalSuccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, courseIds, token } = req.body as {
        courseId?: string;
        courseIds?: string[];
        token: string;
      };
      const userId = req.user?._id;

      console.log("PayPal success callback:", {
        courseId,
        courseIds,
        token,
        userId,
      });

      if (
        (!courseId && (!Array.isArray(courseIds) || courseIds.length === 0)) ||
        !token
      ) {
        return next(
          new ErrorHandler("Missing courseId(s) or PayPal token", 400)
        );
      }

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const targetCourseIds: string[] = courseId
        ? [courseId]
        : Array.from(new Set((courseIds as string[]).filter(Boolean)));

      const courses = await CourseModel.find({ _id: { $in: targetCourseIds } });
      if (!courses || courses.length === 0) {
        return next(new ErrorHandler("Course(s) not found", 404));
      }

      // 1) Kiểm tra trạng thái order trên PayPal
      const orderRequest = new paypal.orders.OrdersGetRequest(token);
      let orderStatus: string;

      try {
        const orderResponse = await paypalClient.execute(orderRequest);
        orderStatus = orderResponse.result.status;
        console.log("PayPal order status:", orderStatus);

        if (orderStatus !== "APPROVED") {
          return next(
            new ErrorHandler(
              `PayPal order is not approved. Current status: ${orderStatus}`,
              400
            )
          );
        }
      } catch (orderError: any) {
        console.error("PayPal order status check error:", orderError);
        if (orderError.statusCode === 404) {
          console.error("PayPal order not found. Token:", token);
          return next(
            new ErrorHandler(
              "PayPal order not found. Please check the token.",
              404
            )
          );
        } else if (orderError.statusCode === 400) {
          console.error(
            "PayPal order invalid. Error details:",
            orderError.result
          );
          return next(new ErrorHandler("Invalid PayPal order token.", 400));
        }
        return next(
          new ErrorHandler("Failed to check PayPal order status", 500)
        );
      }

      const existingOrder = await OrderModel.findOne({
        "payment_info.order_token": token,
        payment_method: "paypal",
      });

      if (existingOrder) {
        if (!existingOrder.userId && req.user?._id) {
          await OrderModel.updateOne(
            { _id: existingOrder._id },
            {
              $set: {
                userId: new mongoose.Types.ObjectId(String(req.user._id)),
              },
            }
          );
        }

        const patched = await OrderModel.findById(existingOrder._id).lean();

        return res.status(200).json({
          success: true,
          message: "Payment already processed",
          payment: {
            id: patched?.payment_info?.id,
            amount: patched?.payment_info?.amount,
            currency: patched?.payment_info?.currency,
          },
          order: {
            id: patched?._id,
            items: patched?.items,
            total: patched?.total,
            currency: patched?.payment_info?.currency,
            userId: patched?.userId ?? null,
          },
        });
      }

      // 3) Capture thanh toán
      const captureRequest = new paypal.orders.OrdersCaptureRequest(token);
      let captureResult: any;

      try {
        captureResult = await paypalClient.execute(captureRequest);
        console.log(
          "PayPal capture result:",
          JSON.stringify(captureResult.result, null, 2)
        );
      } catch (captureError: any) {
        console.error("PayPal capture error:", captureError);

        if (captureError.statusCode === 400) {
          console.error(
            "PayPal capture 400 error details:",
            captureError.result
          );
          return next(
            new ErrorHandler(
              "Invalid PayPal order. Please check the order status.",
              400
            )
          );
        } else if (captureError.statusCode === 404) {
          return next(
            new ErrorHandler("PayPal order not found. Please try again.", 404)
          );
        } else if (captureError.statusCode === 422) {
          return next(
            new ErrorHandler(
              "PayPal order cannot be captured. Order may not be approved.",
              422
            )
          );
        }

        return next(new ErrorHandler("Failed to capture PayPal payment", 500));
      }

      const capture =
        captureResult.result.purchase_units[0].payments.captures[0];
      const paymentId = capture.id;
      const payerId = captureResult.result.payer.payer_id;
      const paymentStatus = capture.status;
      const paymentAmount = parseFloat(capture.amount.value);

      console.log("Payment details:", {
        paymentId,
        payerId,
        status: paymentStatus,
        amount: paymentAmount,
        currency: capture.amount.currency_code,
      });

      if (paymentStatus !== "COMPLETED") {
        console.error(`Payment not completed. Status: ${paymentStatus}`);
        return next(
          new ErrorHandler(
            `Payment not completed. Status: ${paymentStatus}`,
            400
          )
        );
      }

      // 4) Tính items/total cho order
      const items = courses.map((c: any) => ({
        courseId: String(c._id),
        price: Number(c.price || 0),
      }));
      const total = items.reduce(
        (s: number, it: any) => s + (it.price || 0),
        0
      );

      // 5) Upsert Order (hợp nhất đơn) theo token để đảm bảo idempotent ở mức DB
      const upsertFilter: any = {
        "payment_info.order_token": token,
        payment_method: "paypal",
      };
      const upsertUpdate: any = {
        $setOnInsert: {
          items,
          total,
          userId: new mongoose.Types.ObjectId(String(userId)),
          payment_info: {
            id: paymentId,
            status: "succeeded",
            amount: paymentAmount,
            currency: capture.amount.currency_code,
            payer_id: payerId,
            order_token: token,
            paid_at: new Date(),
          },
          payment_method: "paypal",
          emailSent: false,
          notificationSent: false,
        },
      };

      const consolidatedOrder = await OrderModel.findOneAndUpdate(
        upsertFilter,
        upsertUpdate,
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log("Consolidated order created:", consolidatedOrder._id);

      try {
        const purchasedIds = items.map(
          (it: any) => new mongoose.Types.ObjectId(String(it.courseId))
        );
        await CartModel.updateOne(
          { userId: new mongoose.Types.ObjectId(String(userId)) },
          { $pull: { items: { courseId: { $in: purchasedIds } } } }
        );
      } catch (cartErr: any) {
        console.error(
          "Failed to remove purchased items from cart:",
          cartErr?.message || cartErr
        );
      }

      // 7) Đặt cờ notificationSent theo kiểu nguyên tử
      const justSetFlag = await OrderModel.findOneAndUpdate(
        { _id: consolidatedOrder._id, notificationSent: { $ne: true } },
        { $set: { notificationSent: true } },
        { new: true }
      );

      // 8) Chỉ lần đầu (khi set cờ thành công) mới enroll + tạo notifications + gửi email
      if (justSetFlag) {
        // 8.1 Enroll & tăng purchased
        for (const c of courses) {
          const cid = String((c as any)._id);
          try {
            const existing = await EnrolledCourseModel.findOne({
              userId,
              courseId: cid,
            });
            if (!existing) {
              await EnrolledCourseModel.create({ userId, courseId: cid });
              await CourseModel.updateOne(
                { _id: c._id },
                { $inc: { purchased: 1 } }
              );
            }

            // 8.2 Notifications
            if (user && user.notificationSettings.on_payment_success) {
              await createAndSendNotification({
                userId: userId.toString(), // ID của người mua
                title: "Order Confirmation - PayPal",
                message: `You have successfully purchased ${
                  (c as any).name
                } via PayPal`,
              });
            }
            const creatorId = (c as any).creatorId.toString();
            const creatorUser = await userModel
              .findById(creatorId)
              .select("notificationSettings");

            // Chỉ gửi nếu tìm thấy user (creatorUser) VÀ họ bật 'on_new_student'
            if (
              creatorUser &&
              creatorUser.notificationSettings.on_new_student
            ) {
              await createAndSendNotification({
                userId: creatorId, // ID của người bán
                title: "New Order",
                message: `${user.name} purchased ${(c as any).name} via PayPal`,
                link: `fakeURL`, // Thêm link
              });
            }
          } catch (err: any) {
            console.error(
              "Failed processing course enrollment/notification:",
              cid,
              err?.message || err
            );
          }
        }

        // 8.3 Email (giữ cờ emailSent như bạn đang dùng)
        try {
          const totalPaid = total;
          const mailData = {
            order: {
              _id:
                (consolidatedOrder._id as any)?.toString()?.slice(0, 6) ||
                (paymentId as any)?.toString()?.slice(0, 6),
              date: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              items: courses.map((c: any) => ({
                name: c.name,
                price: Number(c.price || 0),
              })),
              total: totalPaid,
            },
          } as any;

          const subject =
            items.length > 1
              ? `Order Confirmation - ${items.length} courses`
              : `Order Confirmation - ${courses[0]?.name || "Course"}`;

          const reservedForEmail = await OrderModel.findOneAndUpdate(
            { _id: consolidatedOrder._id, emailSent: { $ne: true } },
            { $set: { emailSent: true } },
            { new: true }
          );

          if (reservedForEmail) {
            await sendMail({
              email: (user as any).email,
              subject,
              template: "order-confirmation-multi.ejs",
              data: mailData,
            });
            console.log("Confirmation email sent to:", (user as any).email);
          } else {
            console.log("Email already sent for order:", consolidatedOrder._id);
          }
        } catch (error: any) {
          console.error("Email sending failed:", error?.message || error);
        }
      } else {
        console.log(
          "Notifications already sent for order:",
          consolidatedOrder._id
        );
      }

      // 9) Trả kết quả
      res.status(200).json({
        success: true,
        message: "Payment completed successfully",
        payment: {
          id: paymentId,
          amount: paymentAmount,
          currency: capture.amount.currency_code,
        },
        order: {
          id: consolidatedOrder._id,
          items,
          total,
          currency: capture.amount.currency_code,
        },
      });
    } catch (error: any) {
      console.error("PayPal success error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const checkPayPalOrderStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return next(new ErrorHandler("Order ID is required", 400));
      }

      console.log("Checking PayPal order status for orderId:", orderId);

      const orderRequest = new paypal.orders.OrdersGetRequest(orderId);

      try {
        const order = await paypalClient.execute(orderRequest);
        console.log("PayPal order status:", order.result.status);

        res.status(200).json({
          success: true,
          order: {
            id: order.result.id,
            status: order.result.status,
            intent: order.result.intent,
            amount: order.result.purchase_units[0].amount,
            create_time: order.result.create_time,
            update_time: order.result.update_time,
          },
        });
      } catch (error: any) {
        console.error("PayPal order status check error:", error);

        if (error.statusCode === 404) {
          console.error("PayPal order not found. OrderId:", orderId);
          return next(new ErrorHandler("PayPal order not found", 404));
        } else if (error.statusCode === 400) {
          console.error("PayPal order invalid. Error details:", error.result);
          return next(new ErrorHandler("Invalid PayPal order", 400));
        }

        console.error("PayPal order status check error details:", error);
        return next(
          new ErrorHandler("Failed to check PayPal order status", 500)
        );
      }
    } catch (error: any) {
      console.error("Unexpected error in checkPayPalOrderStatus:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const checkPayPalPaymentStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return next(new ErrorHandler("Payment ID is required", 400));
      }

      const order = await OrderModel.findOne({
        "payment_info.id": paymentId,
        payment_method: "paypal",
      });

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      res.status(200).json({
        success: true,
        order: {
          id: order._id,
          status: order.payment_info.status,
          amount: order.payment_info.amount,
          currency: order.payment_info.currency,
          payment_method: order.payment_method,
          items: (order as any).items || undefined,
          total: (order as any).total || undefined,
          courseId: (order as any).courseId || undefined,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const cancelPayPalPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.query;

      res.status(200).json({
        success: true,
        message: "Payment cancelled successfully",
        courseId: courseId,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
