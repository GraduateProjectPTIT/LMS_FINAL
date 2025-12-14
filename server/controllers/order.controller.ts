import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel, { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import CourseModel, { ICourse } from "../models/course.model";
import {
  getAllOrdersService,
  getPaidOrdersService,
  newOrder,
  getOrderDetailService,
  getUserOrderDetailService,
  getTutorOrdersService,
  getTutorOrderDetailService,
  getUserOrdersService,
} from "../services/order.service";
import sendMail from "../utils/sendMail";
import path from "path";
import ejs from "ejs";
import NotificationModel from "../models/notification.model";
import { normalizeOrders } from "../utils/order.helpers";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import stripe from "../utils/stripe";
import paypalClient, { paypal } from "../utils/paypal";
import {
  createAndSendNotification,
  createNotificationService,
} from "../services/notification.service";
require("dotenv").config();

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info, payment_method } = req.body as IOrder;

      const userId = req.user?._id;
      const user = await userModel.findById(req.user?._id);

      if (!courseId) {
        return next(new ErrorHandler("Course ID is required", 400));
      }
      const courseIdStr = String(courseId);

      const existingEnrollment = await EnrolledCourseModel.findOne({
        userId,
        courseId: courseIdStr,
      });

      if (existingEnrollment) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const course: ICourse | null = await CourseModel.findById(courseIdStr);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const courseIdSafe = String(course._id);
      const data: any = {
        courseId: courseIdSafe,
        items: [{ courseId: courseIdSafe, price: Number(course.price || 0) }],
        total: Number(course.price || 0),
        userId: (user?._id as unknown as string).toString(),
        payment_info,
        payment_method: payment_method || "stripe",
      };

      const mailData = {
        order: {
          _id: (course._id as any)?.toString()?.slice(0, 6),
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
        await EnrolledCourseModel.create({ userId, courseId: courseIdStr });
      } catch (enrollErr: any) {
        if (enrollErr?.code === 11000) {
          console.warn("Enrollment already exists for user/course", {
            userId,
            courseId: courseIdStr,
          });
        } else {
          console.error(
            "Failed to create enrollment:",
            enrollErr?.message || enrollErr
          );
        }
      }

      // await redis.set(userId as string, JSON.stringify(user));
      // const userPayload = {
      //   userId: user ? user._id.toString() : "",
      //   title: "Xác nhận đơn hàng",
      //   message: `Bạn đã mua thành công khóa học: ${course.name}`,
      // };
      // createAndSendNotification(userPayload);

      // if (course.creatorId) {
      //   const tutorPayload = {
      //     userId: course.creatorId.toString(),
      //     title: "Đơn hàng mới",
      //     message: `Học viên ${
      //       user?.name ?? "Người dùng"
      //     } vừa mua khóa học của bạn: ${course.name}`,
      //   };
      //   createAndSendNotification(tutorPayload);
      // }

      await CourseModel.updateOne(
        { _id: course._id },
        { $inc: { purchased: 1 } }
      );

      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAdminOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(req.query, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getUserOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getUserOrdersService(req.user, req.query, res);
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

export const getUserOrderDetail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      await getUserOrderDetailService(req.user, orderId, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getAdminOrderDetail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      await getOrderDetailService(orderId, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getTutorOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getTutorOrdersService(req.user, req.query, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getTutorOrderDetail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      await getTutorOrderDetailService(req.user, orderId, res, next);
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

      const existingEnrollment = await EnrolledCourseModel.findOne({
        userId,
        courseId,
      });

      if (existingEnrollment) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      try {
        new URL(baseUrl);
      } catch (error) {
        console.error("Invalid ORIGIN URL:", baseUrl);
        return next(new ErrorHandler("Invalid ORIGIN URL configuration", 500));
      }

      const successUrl = `${baseUrl}/payment-success?success=true&session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}`;
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

    const items = [
      {
        courseId: String(course._id),
        price: Number(course.price || 0),
      },
    ];

    const total = items[0].price || 0;

    const upsertFilter: any = {
      "payment_info.id": session.payment_intent,
      payment_method: "stripe",
    };

    const upsertUpdate: any = {
      $setOnInsert: {
        courseId: String(course._id),
        items,
        total,
        userId: new mongoose.Types.ObjectId(String(userId)),
        payment_info: {
          id: session.payment_intent,
          payment_intent_id: session.payment_intent,
          status:
            session.payment_status === "paid" ? "succeeded" : "failed",
          amount: session.amount_total / 100,
          currency: session.currency,
          metadata: session.metadata || {},
          paid_at: new Date(),
        },
        payment_method: "stripe",
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

    console.log("Consolidated Stripe order:", consolidatedOrder._id);

    const justSetFlag = await OrderModel.findOneAndUpdate(
      { _id: consolidatedOrder._id, notificationSent: { $ne: true } },
      { $set: { notificationSent: true } },
      { new: true }
    );

    if (justSetFlag) {
      try {
        const existingEnrollment = await EnrolledCourseModel.findOne({
          userId,
          courseId,
        });

        if (!existingEnrollment) {
          await EnrolledCourseModel.create({ userId, courseId });
          await CourseModel.updateOne(
            { _id: course._id },
            { $inc: { purchased: 1 } }
          );
        }

        if (user && (user as any).notificationSettings?.on_payment_success) {
          await createAndSendNotification({
            userId: userId.toString(),
            title: "Order Confirmation - Stripe",
            message: `You have successfully purchased ${course.name} via Stripe`,
            link: `/order-detail?focusOrder=${consolidatedOrder._id}`,
          });
        }

        const creatorId = (course as any).creatorId?.toString();
        if (creatorId) {
          const creatorUser = await userModel
            .findById(creatorId)
            .select("notificationSettings");

          if (
            creatorUser &&
            (creatorUser as any).notificationSettings?.on_new_student
          ) {
            await createAndSendNotification({
              userId: creatorId,
              title: "New Order",
              message: `${user.name} purchased ${course.name} via Stripe`,
            });
          }
        }
      } catch (err: any) {
        console.error(
          "Failed processing Stripe enrollment/notification:",
          err?.message || err
        );
      }

      const mailData = {
        order: {
          _id:
            (consolidatedOrder._id as any)?.toString()?.slice(0, 6) ||
            (courseId as any)?.toString()?.slice(0, 6),
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
        const reservedForEmail = await OrderModel.findOneAndUpdate(
          { _id: consolidatedOrder._id, emailSent: { $ne: true } },
          { $set: { emailSent: true } },
          { new: true }
        );

        if (reservedForEmail) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
          console.log("Confirmation email sent to:", user.email);
        } else {
          console.log(
            "Email already sent for Stripe order:",
            consolidatedOrder._id
          );
        }
      } catch (error: any) {
        console.error("Email sending failed:", error?.message || error);
      }
    } else {
      console.log(
        "Notifications already processed for Stripe order:",
        consolidatedOrder._id
      );
    }

    console.log("Stripe payment processed successfully");
  } catch (error: any) {
    console.error("Error processing payment:", error.message);
  }
};
