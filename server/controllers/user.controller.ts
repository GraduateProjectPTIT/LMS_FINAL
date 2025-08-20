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
  deleteMyAccountService,
} from "../services/user.service";
import ErrorHandler from "../utils/ErrorHandler";
import { IUpdatePassword } from "../types/auth.types";
import { paginate } from "../utils/pagination.helper"; // Import our new helper
import userModel from "../models/user.model";

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
    // 1. Call the service and pass the request query
    const paginatedUsers = await getAllUsersService(req.query);

    // 2. Send the response with the data returned from the service
    res.status(200).json({
      success: true,
      ...paginatedUsers,
    });
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
