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
} from "../services/user.service";

// --- LẤY THÔNG TIN USER ---
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserById(req.user?._id);
    res.status(200).json({ success: true, user });
  }
);

// --- CẬP NHẬT THÔNG TIN ---
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await updateUserInfoService(req.user?._id, req.body);
    res.status(200).json({ success: true, user });
  }
);

// --- CẬP NHẬT ẢNH ĐẠI DIỆN ---
export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await updateProfilePictureService(req.user?._id, req.file);
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
