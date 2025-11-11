// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  getUserById,
  updateUserInfoService,
  updateUserRoleService,
  updatePasswordService,
  deleteMyAccountService,
  updateAvatarService,
  updateNotificationSettingsService,
} from "../services/user.service";
import ErrorHandler from "../utils/ErrorHandler";
import { IUpdatePassword } from "../types/auth.types";
import { paginate } from "../utils/pagination.helper"; // Import our new helper
import userModel from "../models/user.model";
import { INotificationSettingsData } from "../types/user.types";

// --- CẬP NHẬT MẬT KHẨU ---
export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body as IUpdatePassword;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    // Gọi service với các tham số đã được xác thực
    await updatePasswordService({
      userId: userId.toString(),
      oldPassword,
      newPassword,
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  }
);

// --- LẤY THÔNG TIN USER ---
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    console.log(userId);
    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    const user = await getUserById(userId.toString());
    res.status(200).json({ success: true, user });
  }
);

export const updateNotificationSettings = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: INotificationSettingsData = req.body;
      const userId = req.user?._id;

      // 2. Gọi service mới
      if (!userId) {
        return next(new ErrorHandler("Authentication required", 401));
      }

      const settings = await updateNotificationSettingsService(
        userId.toString(),
        data
      );

      res.status(200).json({
        success: true,
        settings, // 3. Trả về cài đặt đã cập nhật
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// --- CẬP NHẬT THÔNG TIN ---
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    // ✅ Bắt buộc phải có bước kiểm tra này
    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    const user = await updateUserInfoService(userId.toString(), req.body);
    res.status(200).json({ success: true, user });
  }
);

// --- CẬP NHẬT ẢNH ĐẠI DIỆN ---
export const updateAvatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body; // 'avatar' here is the base64 string
      const userId = req.user?._id.toString();

      // --- VALIDATION ---
      if (!avatar || typeof avatar !== "string") {
        return next(
          new ErrorHandler("Please provide a valid avatar image", 400)
        );
      }
      if (!userId) {
        return next(new ErrorHandler("User not found, please log in.", 401));
      }

      // --- CALL SERVICE ---
      // Pass the base64 string to the service
      updateAvatarService(userId, avatar, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// --- TỰ XÓA USER ---

export const deleteMyAccount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id.toString();

    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    // Gọi service để xử lý logic xóa
    await deleteMyAccountService(userId);

    // Xóa cookie token để đăng xuất người dùng sau khi xóa tài khoản
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });

    res.status(200).json({
      success: true,
      message: "Your account has been deleted successfully.",
    });
  }
);
