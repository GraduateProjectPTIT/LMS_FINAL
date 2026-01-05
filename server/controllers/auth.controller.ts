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
  resendCodeService,
  completeSocialRegisterService,
} from "../services/auth.service";
import {
  ILoginRequest,
  ISocialAuthBody,
  IUpdatePassword,
} from "../types/auth.types";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
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

// --- GỬI LẠI MÃ KÍCH HOẠT ---
export const resendCode = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await resendCodeService(req.body);

    // Trả về kết quả thành công
    res.status(200).json(result);
  }
);

// --- ĐĂNG NHẬP ---
export const login = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await loginUserService(req.body as ILoginRequest);

    sendToken(user, 200, res);
  }
);
// --- ĐĂNG NHẬP QUA MẠNG XÃ HỘI (ĐÃ CẬP NHẬT) ---
export const socialLoginCheck = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const serviceResponse = await socialAuthService(req.body);
    if (serviceResponse.status === "success") {
      const user = serviceResponse.userResponse;
      console.log(user);
      if (!user) {
        return next(new ErrorHandler("User data is invalid", 500));
      }
      sendToken(user, 200, res);
    } else {
      res.status(200).json(serviceResponse);
    }
  }
);

export const socialRegister = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await completeSocialRegisterService(
      req.body as ISocialAuthBody
    );
    if (!user) {
      return next(new ErrorHandler("User data is invalid", 500));
    }

    sendToken(user, 201, res);
  }
);
// --- ĐĂNG XUẤT ---
export const logout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
      return next(new ErrorHandler("User is not authenticated", 401));
    }

    const message = await logoutUserService(res, req.user._id.toString());
    console.log(req.user._id);

    res.status(200).json({ success: true, message });
  }
);

// --- LÀM MỚI TOKEN ---
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, accessToken, refreshToken } = await updateAccessTokenService(
      req.cookies.refresh_token
    );

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

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return next(
        new ErrorHandler("Token and new password are required.", 400)
      );
    }

    const result = await resetPasswordService(resetToken, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return next(error);
  }
};
