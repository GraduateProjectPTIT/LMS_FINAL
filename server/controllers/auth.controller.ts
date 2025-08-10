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
  forgotPasswordService,
  resetPasswordService,
} from "../services/auth.service";
import { ILoginRequest, IUpdatePassword } from "../types/auth.types";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt"; // Import hàm tiện ích mới
import ErrorHandler from "../utils/ErrorHandler";
import { IUser } from "../models/user.model";

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
    // 1. Lấy user đã được xác thực từ service
    const user = await loginUserService(req.body as ILoginRequest); // 2. Gọi sendToken để tạo token, set cookie và gửi response //    Hàm này sẽ làm tất cả công việc còn lại

    sendToken(user, 200, res);
  }
);
// --- ĐĂNG NHẬP QUA MẠNG XÃ HỘI ---
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = await socialAuthService(req.body);
    sendToken(user, 200, res);
  }
);

// --- ĐĂNG XUẤT ---
export const logout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
      return next(new ErrorHandler("User not authenticated", 401));
    }
    const message = await logoutUserService(res, req.user._id.toString());

    res.status(200).json({ success: true, message });
  }
);

// --- LÀM MỚI TOKEN ---
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, accessToken, refreshToken } = await updateAccessTokenService(
      req.cookies.refresh_token
    );

    // Trực tiếp set cookie và gửi response tại đây
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      success: true,
      accessToken,
    });
  }
);

export const forgotPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    console.log("Request Body:", req.body);

    if (!email) {
      return next(new ErrorHandler("Please provide an email", 400));
    }
    const result = await forgotPasswordService(email);
    res.status(200).json(result);
  }
);

// ✅ Controller `resetPassword` được cập nhật
export const resetPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    // Lấy thêm `resetCode` từ body
    const { password, resetCode } = req.body;

    if (!password || !resetCode) {
      return next(
        new ErrorHandler(
          "Please provide a new password and the reset code",
          400
        )
      );
    }

    const result = await resetPasswordService(token, resetCode, password);

    res.status(200).json({ success: true, message: result.message });
  }
);
