import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";
import NotificationModel from "../models/notification.model";
import sendMail from "../utils/sendMail";
import path from "path";
import ejs from "ejs";
import paypalClient, { paypal } from "../utils/paypal";
import EnrolledCourseModel from "../models/enrolledCourse.model";

export const createPayPalCheckoutSession = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user?._id;
      
      if (!courseId) {
        return next(new ErrorHandler("Course ID is required", 400));
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const existingEnrollment = await EnrolledCourseModel.findOne({ userId, courseId });

      if (existingEnrollment) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: course.price.toString(),
            },
            description: course.name,
            custom_id: courseId,
            reference_id: userId?.toString(),
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?courseId=${courseId}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses?canceled=true`,
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
          course: {
            id: course._id,
            name: course.name,
            price: course.price,
            description: course.description,
          },
          paypalLinks: order.result.links,
        });
      } catch (error: any) {
        console.error("PayPal order creation error:", error);
        if (error.statusCode === 400) {
          return next(new ErrorHandler("Invalid PayPal request. Please check course price and details.", 400));
        }
        return next(new ErrorHandler("Failed to create PayPal order. Please try again.", 500));
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
      const { courseId, token } = req.body;
      const userId = req.user?._id;

      console.log("PayPal success callback:", { courseId, token, userId });

      if (!courseId || !token) {
        return next(new ErrorHandler("Missing courseId or PayPal token", 400));
      }

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const user = await userModel.findById(userId);
      const course = await CourseModel.findById(courseId);

      if (!user || !course) {
        return next(new ErrorHandler("User or course not found", 404));
      }

      const existingEnrollment = await EnrolledCourseModel.findOne({ userId, courseId });

      if (existingEnrollment) {
        return res.status(400).json({
          success: false,
          message: "You have already purchased this course"
        });
      }

      const orderRequest = new paypal.orders.OrdersGetRequest(token);
      let orderStatus;
      
      try {
        const orderResponse = await paypalClient.execute(orderRequest);
        orderStatus = orderResponse.result.status;
        console.log("PayPal order status:", orderStatus);
        
        if (orderStatus !== "APPROVED") {
          return next(new ErrorHandler(`PayPal order is not approved. Current status: ${orderStatus}`, 400));
        }
      } catch (orderError: any) {
        console.error("PayPal order status check error:", orderError);
        
        if (orderError.statusCode === 404) {
          console.error("PayPal order not found. Token:", token);
          return next(new ErrorHandler("PayPal order not found. Please check the token.", 404));
        } else if (orderError.statusCode === 400) {
          console.error("PayPal order invalid. Error details:", orderError.result);
          return next(new ErrorHandler("Invalid PayPal order token.", 400));
        }
        
        console.error("PayPal order status check error details:", orderError);
        return next(new ErrorHandler("Failed to check PayPal order status", 500));
      }

      const captureRequest = new paypal.orders.OrdersCaptureRequest(token);
      
      let captureResult;
      try {
        captureResult = await paypalClient.execute(captureRequest);
        console.log("PayPal capture result:", JSON.stringify(captureResult.result, null, 2));
      } catch (captureError: any) {
        console.error("PayPal capture error:", captureError);
        
        if (captureError.statusCode === 400) {
          console.error("PayPal capture 400 error details:", captureError.result);
          return next(new ErrorHandler("Invalid PayPal order. Please check the order status.", 400));
        } else if (captureError.statusCode === 404) {
          return next(new ErrorHandler("PayPal order not found. Please try again.", 404));
        } else if (captureError.statusCode === 422) {
          return next(new ErrorHandler("PayPal order cannot be captured. Order may not be approved.", 422));
        }
        
        return next(new ErrorHandler("Failed to capture PayPal payment", 500));
      }

      const capture = captureResult.result.purchase_units[0].payments.captures[0];
      const paymentId = capture.id;
      const payerId = captureResult.result.payer.payer_id;
      const paymentStatus = capture.status;
      const paymentAmount = parseFloat(capture.amount.value);

      console.log("Payment details:", {
        paymentId,
        payerId,
        status: paymentStatus,
        amount: paymentAmount,
        currency: capture.amount.currency_code
      });

      if (paymentStatus !== "COMPLETED") {
        console.error(`Payment not completed. Status: ${paymentStatus}`);
        return next(new ErrorHandler(`Payment not completed. Status: ${paymentStatus}`, 400));
      }

      const orderData = {
        courseId: courseId as string,
        userId: userId?.toString() || "",
        payment_info: {
           id: paymentId,
           status: "succeeded",
           amount: paymentAmount,
           currency: capture.amount.currency_code,
           payer_id: payerId,
         },
         payment_method: "paypal",
       };

      const newOrder = await OrderModel.create(orderData);
      console.log("Order created:", newOrder._id);

      // Enrollment is recorded below; removed legacy user.courses update

      try {
        await EnrolledCourseModel.create({ userId, courseId });
      } catch (enrollErr: any) {
        if (enrollErr?.code === 11000) {
          console.warn("Enrollment already exists for user/course", { userId, courseId });
        } else {
          console.error("Failed to create enrollment:", enrollErr?.message || enrollErr);
        }
      }

      course.purchased += 1;
      await course.save();

      const mailData = {
        order: {
          _id: (newOrder._id as any).toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      try {
        await sendMail({
          email: user.email,
          subject: "Order Confirmation - PayPal",
          template: "order-confirmation.ejs",
          data: mailData,
        });
        console.log("Confirmation email sent to:", user.email);
      } catch (error: any) {
        console.error("Email sending failed:", error.message);
      }

      await NotificationModel.create({
        user: userId,
        title: "New Order - PayPal",
        message: `You have successfully purchased ${course.name} via PayPal`,
        type: "order",
      });

      res.status(200).json({
        success: true,
        message: "Payment completed successfully",
        order: {
          id: newOrder._id,
          courseId: courseId,
          amount: paymentAmount,
          currency: capture.amount.currency_code
        }
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
            update_time: order.result.update_time
          }
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
        return next(new ErrorHandler("Failed to check PayPal order status", 500));
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
        payment_method: "paypal"
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
          courseId: order.courseId
        }
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
        courseId: courseId
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

