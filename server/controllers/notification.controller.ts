import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import * as NotificationService from "../services/notification.service";
import { addClient, removeClient, sendEventToUser } from "../utils/sseManager";

export const notificationStreamController = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
      return;
    }

    const origin = req.headers.origin || "http://localhost:3000";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const userIdString = userId.toString();

    addClient(userIdString, res);

    sendEventToUser(userIdString, "connection_established", {
      message: "SSE connection successful",
    });

    req.on("close", () => {
      removeClient(userIdString, res);
      res.end();
    });
  }
);

export const getAllNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const notifications =
      await NotificationService.getAllNotificationsService();
    res.status(200).json({
      success: true,
      notifications,
    });
  }
);

export const getMyNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { status = "unread", q, page = 1, limit = 20 } = req.query as any;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const filter: any = {};
    if (status !== "all") {
      filter.status = status;
    }
    if (q) filter.title = { $regex: new RegExp(q, "i") };

    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));

    const { data, meta } =
      await NotificationService.getUserNotificationsService({
        userId: userId.toString(),
        filter,
        page: pageNum,
        limit: pageSize,
      });

    res.status(200).json({
      success: true,
      paginatedResult: {
        data,
        meta,
      },
    });
  }
);

export const markMyNotificationRead = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const notifId = req.params.id;
    const user = req.user;

    try {
      const notification =
        await NotificationService.markNotificationAsReadService(notifId, user!);
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }
      res.status(200).json({ success: true, notification });
    } catch (error: any) {
      if (error.message === "Forbidden") {
        return next(
          new ErrorHandler("You are not allowed to perform this action", 403)
        );
      }
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const markAllMyNotificationsRead = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }
    const modifiedCount =
      await NotificationService.markAllNotificationsAsReadService(
        userId.toString()
      );
    res.status(200).json({ success: true, modifiedCount });
  }
);

export const createNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, title, message, link } = req.body;
      if (!userId || !title || !message) {
        return next(
          new ErrorHandler("userId, title, and message are required", 400)
        );
      }

      const notification = await NotificationService.createAndSendNotification({
        userId,
        title,
        message,
        link,
      });

      res.status(201).json({
        success: true,
        notification,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
