// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  registerUserService,
  activateUserService,
  loginUserService,
  logoutUserService,
  updateAccessTokenService,
  socialAuthService,
  updatePasswordService,
} from "../services/auth.service";
import { ILoginRequest, IUpdatePassword } from "../types/auth.types";
import { sendTokenResponse } from "../utils/jwt"; // Import hàm tiện ích mới

// --- ĐĂNG KÝ ---
export const register = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await registerUserService(req.body);
    res.status(201).json(result);
  }
);

// --- KÍCH HOẠT USER ---
export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    await activateUserService(req.body);
    res
      .status(201)
      .json({ success: true, message: "Account activated successfully" });
  }
);

// --- ĐĂNG NHẬP ---
export const login = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, accessToken, refreshToken } = await loginUserService(
      req.body as ILoginRequest
    );
    sendTokenResponse(res, 200, user, accessToken, refreshToken);
  }
);

// --- ĐĂNG NHẬP QUA MẠNG XÃ HỘI ---
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, accessToken, refreshToken } = await socialAuthService(
      req.body
    );
    sendTokenResponse(res, 200, user, accessToken, refreshToken);
  }
);

// --- ĐĂNG XUẤT ---
export const logout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const message = await logoutUserService(res, req.user?._id);
    res.status(200).json({ success: true, message });
  }
);

// --- LÀM MỚI TOKEN ---
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, accessToken, refreshToken } = await updateAccessTokenService(
      req.cookies.refresh_token
    );
    // Gửi lại response với token mới
    sendTokenResponse(res, 200, user, accessToken, refreshToken);
  }
);

// --- CẬP NHẬT MẬT KHẨU ---
export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body as IUpdatePassword;
    const userId = req.user?._id;
    await updatePasswordService({ userId, oldPassword, newPassword });
    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  }
);
