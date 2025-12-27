import mongoose from "mongoose";
import ErrorHandler from "../utils/ErrorHandler";
import paypalClient, { paypal } from "../utils/paypal";
import sendMail from "../utils/sendMail";
import { createAndSendNotification } from "../services/notification.service";
import paypalRepository from "../repositories/paypal.repository";

class PaypalService {
  // ---------------- Logic tạo Checkout Session ----------------
  async createCheckoutSession(userId: string, courseIdsInput: string[]) {
    // 1. Validate User
    const user = await paypalRepository.findUserById(userId);
    if (!user) throw new ErrorHandler("User not found", 404);

    // 2. Validate Courses
    const targetCourseIds = Array.from(new Set(courseIdsInput.filter(Boolean)));
    const courses = await paypalRepository.findCoursesByIds(targetCourseIds);

    if (!courses || courses.length === 0) {
      throw new ErrorHandler("Course(s) not found", 404);
    }

    // Check missing courses
    const foundIds = new Set(courses.map((c) => String(c._id)));
    const missing = targetCourseIds.filter((id) => !foundIds.has(String(id)));
    if (missing.length > 0) {
      throw new ErrorHandler(`Course(s) not found: ${missing.join(", ")}`, 404);
    }

    // 3. Filter already enrolled courses
    const existingEnrollments = await paypalRepository.findExistingEnrollments(
      userId,
      targetCourseIds
    );
    const alreadyEnrolledIds = new Set(
      existingEnrollments.map((e: any) => String(e.courseId))
    );
    const purchasableCourses = courses.filter(
      (c: any) => !alreadyEnrolledIds.has(String(c._id))
    );

    if (purchasableCourses.length === 0) {
      throw new ErrorHandler(
        "You have already purchased all selected courses",
        400
      );
    }

    // 4. Calculate Total
    const totalAmount = purchasableCourses.reduce(
      (sum: number, c: any) => sum + Number(c.price || 0),
      0
    );
    const isMulti = purchasableCourses.length > 1;

    // 5. Create PayPal Request
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
            : String(purchasableCourses[0]._id),
          reference_id: userId,
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
            }/payment-success?courseId=${String(purchasableCourses[0]._id)}`,
        cancel_url: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/checkout`,
        brand_name: "LMS Platform",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    });

    try {
      const order = await paypalClient.execute(request);
      return {
        orderId: order.result.id,
        courses: purchasableCourses.map((c: any) => ({
          id: c._id,
          name: c.name,
          price: c.price,
          description: c.description,
        })),
        totalAmount,
        paypalLinks: order.result.links,
      };
    } catch (error: any) {
      console.error("PayPal create order error:", error);
      throw new ErrorHandler(
        "Failed to create PayPal order",
        error.statusCode || 500
      );
    }
  }

  // ---------------- Logic Xử lý Payment Success ----------------
  async processPaymentSuccess(
    userId: string,
    token: string,
    courseIdsInput: string[]
  ) {
    // 1. Basic Validation
    const user = await paypalRepository.findUserById(userId);
    if (!user) throw new ErrorHandler("User not found", 404);

    const targetCourseIds = Array.from(new Set(courseIdsInput.filter(Boolean)));
    const courses = (await paypalRepository.findCoursesByIds(
      targetCourseIds
    )) as any;
    if (!courses || courses.length === 0)
      throw new ErrorHandler("Course(s) not found", 404);

    // 2. Check PayPal Order Status
    await this.verifyPayPalOrderStatus(token);

    // 3. Check for Existing Order (Idempotency)
    const existingOrder = (await paypalRepository.findOrderByToken(
      token
    )) as any;
    if (existingOrder) {
      if (!existingOrder.userId) {
        await paypalRepository.updateOrderUser(
          existingOrder._id.toString(),
          userId
        );
      }
      const patched = await paypalRepository.findOrderById(
        existingOrder._id.toString()
      );
      return {
        success: true,
        message: "Payment already processed",
        isAlreadyProcessed: true,
        data: patched,
      };
    }

    // 4. Capture PayPal Payment
    const captureData = await this.capturePayPalOrder(token);

    // 5. Prepare Order Data
    const items = courses.map((c: any) => ({
      courseId: String(c._id),
      price: Number(c.price || 0),
    }));
    const total = items.reduce((s: number, it: any) => s + (it.price || 0), 0);

    const upsertFilter = {
      "payment_info.order_token": token,
      payment_method: "paypal",
    };
    const upsertUpdate = {
      $setOnInsert: {
        items,
        total,
        userId: new mongoose.Types.ObjectId(userId),
        payment_info: {
          id: captureData.paymentId,
          status: "succeeded",
          amount: captureData.paymentAmount,
          currency: captureData.currency,
          payer_id: captureData.payerId,
          order_token: token,
          paid_at: new Date(),
        },
        payment_method: "paypal",
        emailSent: false,
        notificationSent: false,
      },
    };

    // 6. Save Order to DB
    const consolidatedOrder = (await paypalRepository.upsertOrder(
      upsertFilter,
      upsertUpdate
    )) as any;

    // 7. Clear Cart
    await paypalRepository.removeItemsFromCart(
      userId,
      items.map((i: any) => i.courseId)
    );

    // 8. Process Post-Purchase Actions (Enroll, Notify, Email)
    // Only if we successfully set the notification flag (ensure atomic run once)
    const justSetFlag = await paypalRepository.markNotificationSent(
      consolidatedOrder._id.toString()
    );

    if (justSetFlag) {
      await this.handlePostPurchaseActions(
        user,
        courses,
        consolidatedOrder,
        total
      );
    }

    return {
      success: true,
      message: "Payment completed successfully",
      isAlreadyProcessed: false,
      payment: {
        id: captureData.paymentId,
        amount: captureData.paymentAmount,
        currency: captureData.currency,
      },
      order: {
        id: consolidatedOrder._id,
        items,
        total,
        currency: captureData.currency,
      },
    };
  }

  // --- Helper Methods ---

  private async verifyPayPalOrderStatus(token: string) {
    const orderRequest = new paypal.orders.OrdersGetRequest(token);
    try {
      const orderResponse = await paypalClient.execute(orderRequest);

      // SỬA: Chấp nhận cả APPROVED (mới duyệt) và COMPLETED (đã xong)
      const status = orderResponse.result.status;
      if (status !== "APPROVED" && status !== "COMPLETED") {
        throw new ErrorHandler(
          `PayPal order is not approved. Status: ${status}`,
          400
        );
      }
    } catch (error: any) {
      // Nếu là lỗi ErrorHandler mình tự ném ra thì throw tiếp
      if (error instanceof ErrorHandler) throw error;

      // Còn lại là lỗi hệ thống
      throw new ErrorHandler("Invalid PayPal order token or System Error", 400);
    }
  }

  private async capturePayPalOrder(token: string) {
    const captureRequest = new paypal.orders.OrdersCaptureRequest(token);
    try {
      const captureResult = await paypalClient.execute(captureRequest);
      const capture =
        captureResult.result.purchase_units[0].payments.captures[0];

      // SỬA: Chấp nhận cả 'succeeded' và 'COMPLETED'
      if (capture.status !== "succeeded" && capture.status !== "COMPLETED") {
        throw new ErrorHandler(
          `Payment not completed. Status: ${capture.status}`,
          400
        );
      }

      return {
        paymentId: capture.id,
        payerId: captureResult.result.payer.payer_id,
        status: capture.status,
        paymentAmount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
      };
    } catch (error: any) {
      console.error("PayPal capture error details:", error);

      // QUAN TRỌNG: Nếu lỗi là do mình throw (400) ở trên, phải ném nó ra lại
      // Nếu không ném ra lại, nó sẽ chạy xuống dòng throw 500 bên dưới
      if (error instanceof ErrorHandler) {
        throw error;
      }

      // Nếu PayPal báo Order đã được capture rồi (Status 422 - UNPROCESSABLE_ENTITY)
      // Thì mình coi như thành công để không lỗi App
      if (error.statusCode === 422) {
        // Trả về dữ liệu giả định hoặc gọi lại api get order để lấy thông tin
        // Ở đây mình ném lỗi rõ ràng hơn để Frontend xử lý
        throw new ErrorHandler("Order already captured", 400);
      }

      throw new ErrorHandler("Failed to capture PayPal payment", 500);
    }
  }

  private async handlePostPurchaseActions(
    user: any,
    courses: any[],
    order: any,
    total: number
  ) {
    // A. Enroll & Notifications
    for (const c of courses) {
      const cid = String(c._id);
      try {
        const existing = await paypalRepository.checkEnrollmentExists(
          user._id,
          cid
        );
        if (!existing) {
          await paypalRepository.createEnrollment(user._id, cid);
          await paypalRepository.incrementCoursePurchasedCount(cid);
        }

        // Notify Buyer
        if (user.notificationSettings?.on_payment_success) {
          await createAndSendNotification({
            userId: user._id.toString(),
            title: "Order Confirmation - PayPal",
            message: `You have successfully purchased ${c.name} via PayPal`,
            link: `/order-detail?focusOrder=${order._id}`,
          });
        }

        // Notify Creator
        const creatorId = c.creatorId.toString();
        const creatorUser = await paypalRepository.findUserById(creatorId);
        if (creatorUser && creatorUser.notificationSettings?.on_new_student) {
          await createAndSendNotification({
            userId: creatorId,
            title: "New Order",
            message: `${user.name} purchased ${c.name} via PayPal`,
          });
        }
      } catch (err: any) {
        console.error(
          "Failed processing enrollment/notification for course:",
          cid,
          err
        );
      }
    }

    // B. Send Email
    try {
      const reservedForEmail = await paypalRepository.markEmailSent(
        order._id.toString()
      );
      if (reservedForEmail) {
        const mailData = {
          order: {
            _id: order._id.toString().slice(0, 6),
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            items: courses.map((c: any) => ({
              name: c.name,
              price: Number(c.price || 0),
            })),
            total: total,
          },
        };
        const subject =
          courses.length > 1
            ? `Order Confirmation - ${courses.length} courses`
            : `Order Confirmation - ${courses[0]?.name}`;

        await sendMail({
          email: user.email,
          subject,
          template: "order-confirmation-multi.ejs",
          data: mailData,
        });
        console.log("Confirmation email sent to:", user.email);
      }
    } catch (error) {
      console.error("Email sending failed:", error);
    }
  }

  // ---------------- Logic Check Order Status ----------------
  async checkPayPalOrderStatus(orderId: string) {
    const orderRequest = new paypal.orders.OrdersGetRequest(orderId);
    try {
      const order = await paypalClient.execute(orderRequest);
      return {
        id: order.result.id,
        status: order.result.status,
        intent: order.result.intent,
        amount: order.result.purchase_units[0].amount,
        create_time: order.result.create_time,
        update_time: order.result.update_time,
      };
    } catch (error: any) {
      if (error.statusCode === 404)
        throw new ErrorHandler("PayPal order not found", 404);
      throw new ErrorHandler("Failed to check PayPal order status", 500);
    }
  }

  async checkPaymentStatusFromDB(paymentId: string) {
    const order = await paypalRepository.findOrderByPaymentId(paymentId);
    if (!order) throw new ErrorHandler("Order not found", 404);

    return {
      id: order._id,
      status: order.payment_info.status,
      amount: order.payment_info.amount,
      currency: order.payment_info.currency,
      payment_method: order.payment_method,
      items: (order as any).items,
      total: (order as any).total,
      courseId: (order as any).courseId,
    };
  }
}

export default new PaypalService();
