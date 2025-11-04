// src/controllers/notification.controller.ts

import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import * as NotificationService from "../services/notification.service";
import { addClient, removeClient, sendEventToUser } from "../utils/sseManager"; // Import các hàm từ sseManager

export const notificationStreamController = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // req.user được gán từ middleware isAuthenticated
    const userId = req.user?._id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
      return; // Dừng hàm
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const userIdString = userId.toString();

    // Thêm client này vào trình quản lý SSE
    addClient(userIdString, res);

    // Gửi sự kiện xác nhận kết nối qua hàm quản lý tập trung
    sendEventToUser(userIdString, "connection_established", {
      message: "SSE connection successful",
    });

    // Xử lý khi client ngắt kết nối
    req.on("close", () => {
      // Truyền cả userId và đối tượng `res` cụ thể
      removeClient(userIdString, res);
      res.end();
    });
  }
);

/**
 * [ADMIN] Lấy tất cả thông báo.
 */
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

/**
 * Lấy các thông báo của người dùng đang đăng nhập.
 */
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

    const { notifications, total } =
      await NotificationService.getUserNotificationsService({
        userId: userId.toString(),
        filter,
        page: pageNum,
        limit: pageSize,
      });

    res.status(200).json({
      success: true,
      notifications,
      pagination: { page: pageNum, limit: pageSize, total },
    });
  }
);

/**
 * Đánh dấu một thông báo của tôi là đã đọc.
 */
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

/**
 * Đánh dấu tất cả thông báo của tôi là đã đọc.
 */
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

/**
 * Controller để tạo thông báo mới
 */
export const createNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, title, message } = req.body;
      if (!userId || !title || !message) {
        return next(
          new ErrorHandler("userId, title, and message are required", 400)
        );
      }

      // <<< BƯỚC 3: Dùng hàm 2-trong-1 mới
      const notification = await NotificationService.createAndSendNotification({
        userId,
        title,
        message,
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
