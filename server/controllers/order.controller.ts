import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel, { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import CourseModel, { ICourse } from "../models/course.model";
import { getAllOrdersService, getPaidOrdersService, newOrder } from "../services/order.service";
import sendMail from "../utils/sendMail";
import path from "path";
import ejs from "ejs";
import NotificationModel from "../models/notification.model";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import stripe from "../utils/stripe";
import paypalClient, { paypal } from "../utils/paypal";
require("dotenv").config();

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info, payment_method } = req.body as IOrder;

      const userId = req.user?._id;
      const user = await userModel.findById(req.user?._id);
      
      const existingEnrollment = await EnrolledCourseModel.findOne({
        userId,
        courseId,
      });

      if (existingEnrollment) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const course: ICourse | null = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const data: any = {
        courseId: (course._id as string).toString(),
        userId: (user?._id as unknown as string).toString(),
        payment_info,
        payment_method: payment_method || 'stripe',
      };

      const mailData = {
        order: {
          _id: courseId.slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      try {
        await EnrolledCourseModel.create({ userId, courseId });
      } catch (enrollErr: any) {
        if (enrollErr?.code === 11000) {
          console.warn("Enrollment already exists for user/course", { userId, courseId });
        } else {
          console.error("Failed to create enrollment:", enrollErr?.message || enrollErr);
        }
      }

      // await redis.set(userId as string, JSON.stringify(user));

      await NotificationModel.create({
        userId: user?._id as any,
        title: "Order Confirmation",
        message: `You have successfully purchased ${course?.name}`,
      });
      await NotificationModel.create({
        userId: course.creatorId as any,
        title: "New Order",
        message: `${user?.name} purchased ${course?.name}`,
      });

      // Increment purchased without triggering full schema validation
      await CourseModel.updateOne({ _id: course._id }, { $inc: { purchased: 1 } });

      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

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

      try {
        await EnrolledCourseModel.create({ userId, courseId });
      } catch (enrollErr: any) {
        if (enrollErr?.code === 11000) {
          console.warn("Enrollment already exists for user/course", { userId, courseId });
        } else {
          console.error("Failed to create enrollment:", enrollErr?.message || enrollErr);
        }
      }

      await CourseModel.updateOne({ _id: course._id }, { $inc: { purchased: 1 } });

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
        userId: userId as any,
        title: "Order Confirmation - PayPal",
        message: `You have successfully purchased ${course.name} via PayPal`,
      });
      await NotificationModel.create({
        userId: course.creatorId as any,
        title: "New Order",
        message: `${user.name} purchased ${course.name} via PayPal`,
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

 

export const getAdminOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getUserOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;

      const userOrders = await OrderModel.find({ userId });

      if (userOrders.length === 0) {
        return res.json({ message: "No orders found" });
      }

      res.status(200).json({
        success: true,
        orders: userOrders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getPaidOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getPaidOrdersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const createStripeCheckoutSession = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      console.log("ORIGIN:", process.env.ORIGIN);
      console.log("CourseId:", courseId);
      console.log("UserId:", userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const course: ICourse | null = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const existingEnrollment = await EnrolledCourseModel.findOne({ userId, courseId });

      if (existingEnrollment) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const baseUrl = 'http://localhost:3000';

      try {
        new URL(baseUrl);
      } catch (error) {
        console.error("Invalid ORIGIN URL:", baseUrl);
        return next(new ErrorHandler("Invalid ORIGIN URL configuration", 500));
      }
      
      const successUrl = `${baseUrl}/course-enroll/${courseId}?success=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/courses?canceled=true`;

      console.log("Base URL:", baseUrl);
      console.log("Success URL:", successUrl);
      console.log("Cancel URL:", cancelUrl);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: course.name,
                description: course.description,
                images: course.thumbnail?.url ? [course.thumbnail.url] : [],
              },
              unit_amount: Math.round(course.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: user.email,
        metadata: {
          courseId: courseId,
          userId: userId?.toString() || "",
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      res.status(200).json({
        success: true,
        url: session.url,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const stripeWebhook = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Webhook received!");
    console.log("Headers:", req.headers);
    console.log("Body length:", req.body?.length);
    
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    console.log("Stripe signature:", sig ? "Present" : "Missing");
    console.log("Webhook secret:", endpointSecret ? "Present" : "Missing");

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("Webhook event type:", event.type);
    } catch (err: any) {
      console.error("Webhook verification failed:", err.message);
      return next(new ErrorHandler(`Webhook Error: ${err.message}`, 400));
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as any;
        
        await handleSuccessfulPayment(session);
        break;
      
      case "payment_intent.payment_failed":
        const paymentIntent = event.data.object as any;
        console.log("Payment failed:", paymentIntent.id);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);

export const handleSuccessfulPayment = async (session: any) => {
  try {
    console.log("Processing successful payment...");
    console.log("Session metadata:", session.metadata);
    
    const { courseId, userId } = session.metadata;
    
    console.log("CourseId:", courseId);
    console.log("UserId:", userId);
    
    const user = await userModel.findById(userId as string);
    const course = await CourseModel.findById(courseId as string);

    if (!user || !course) {
      console.error("User or course not found");
      return;
    }

    const existingEnrollment = await EnrolledCourseModel.findOne({ userId, courseId });

    if (existingEnrollment) {
      console.log("User already has this course");
      return;
    }

    try {
      await EnrolledCourseModel.create({ userId, courseId });
    } catch (enrollErr: any) {
      if (enrollErr?.code === 11000) {
        console.warn("Enrollment already exists for user/course", { userId, courseId });
      } else {
        console.error("Failed to create enrollment:", enrollErr?.message || enrollErr);
      }
    }

    const orderData = {
      courseId: courseId,
      userId: userId,
      payment_info: {
        id: session.payment_intent,
        status: session.payment_status === 'paid' ? 'succeeded' : 'failed',
        amount: session.amount_total / 100,
        currency: session.currency,
      },
      payment_method: 'stripe',
    };

    await OrderModel.create(orderData);

    await CourseModel.updateOne({ _id: course._id }, { $inc: { purchased: 1 } });

    const mailData = {
      order: {
        _id: courseId.slice(0, 6),
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
        subject: "Order Confirmation",
        template: "order-confirmation.ejs",
        data: mailData,
      });
    } catch (error: any) {
      console.error("Email sending failed:", error.message);
    }

    await NotificationModel.create({
      userId: userId as any,
      title: "Order Confirmation",
      message: `You have successfully purchased ${course.name}`,
    });
    await NotificationModel.create({
      userId: course.creatorId as any,
      title: "New Order",
      message: `${user.name} purchased ${course.name}`,
    });

    console.log("Payment processed successfully");
  } catch (error: any) {
    console.error("Error processing payment:", error.message);
  }
};
