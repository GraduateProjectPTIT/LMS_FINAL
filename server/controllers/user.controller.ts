// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  getUserById,
  updateUserInfoService,
  updateProfilePictureService,
  getAllUsersService,
  updateUserRoleService,
  deleteUserService,
  updatePasswordService,
} from "../services/user.service";
import ErrorHandler from "../utils/ErrorHandler";
import { IUpdatePassword } from "../types/auth.types";

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
export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    // ✅ Bắt buộc phải có bước kiểm tra này
    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    const user = await updateProfilePictureService(userId.toString(), req.file);
    res.status(200).json({ success: true, user });
  }
);

// --- LẤY TẤT CẢ USERS (ADMIN) ---
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await getAllUsersService();
    res.status(200).json({ success: true, users });
  }
);

// --- CẬP NHẬT VAI TRÒ (ADMIN) ---
export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, role } = req.body;
    const user = await updateUserRoleService(id, role);
    res.status(200).json({ success: true, user });
  }
);

// --- XÓA USER (ADMIN) ---
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await deleteUserService(id);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  }
);
