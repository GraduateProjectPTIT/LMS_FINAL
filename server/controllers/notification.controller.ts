import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import NotificationModel from "../models/notification.model";
import cron from "node-cron";

// get all notifications by admin
export const getAllNotifications = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await NotificationModel.find().sort({
            createdAt: -1,
        });

        res.status(201).json({
            success: true,
            notifications,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
}
);

export const getMyNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { status, q, page = 1, limit = 20 } = req.query as any;

      const filter: any = { userId };
      if (status) filter.status = status;
      if (q) filter.title = { $regex: new RegExp(q, "i") };

      const pageNum = Math.max(1, Number(page));
      const pageSize = Math.min(100, Math.max(1, Number(limit)));

      const [notifications, total] = await Promise.all([
        NotificationModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * pageSize)
          .limit(pageSize),
        NotificationModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        notifications,
        pagination: { page: pageNum, limit: pageSize, total },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getTutorPurchaseNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const notifications = await NotificationModel.find({
        userId,
        title: { $regex: /New Order/i },
      })
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, notifications });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const markMyNotificationRead = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifId = req.params.id;
      const notif = await NotificationModel.findById(notifId);
      if (!notif) return next(new ErrorHandler("Notification not found", 404));

      const isOwner = notif.userId?.toString() === req.user?._id?.toString();
      const isAdmin = req.user?.role === "admin";
      if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("Forbidden", 403));
      }

      if (notif.status !== "read") {
        notif.status = "read";
        await notif.save();
      }

      res.status(200).json({ success: true, notification: notif });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const markAllMyNotificationsRead = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const result = await NotificationModel.updateMany(
        { userId, status: { $ne: "read" } },
        { $set: { status: "read" } }
      );

      res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// upate notification status by admin
export const updateNotification = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notification = await NotificationModel.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler("Notification not found", 404));
        } else {
            notification.status ? (notification.status = "read") : notification?.status;
        }

        await notification.save();

        const notifications = await NotificationModel.find().sort({
            createdAt: -1,
        });

        res.status(201).json({
            success: true,
            notifications,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
}
);

// delete notification --- only admin
cron.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await NotificationModel.deleteMany({
        status: "read",
        createAt: { $lt: thirtyDaysAgo },
    });
    console.log("Delete read notifications")
});