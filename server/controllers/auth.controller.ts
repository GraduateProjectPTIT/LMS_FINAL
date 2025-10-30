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

// --- GỬI LẠI MÃ KÍCH HOẠT ---
export const resendCode = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Gọi đến service để xử lý logic
    const result = await resendCodeService(req.body);

    // Trả về kết quả thành công
    res.status(200).json(result);
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
// --- ĐĂNG NHẬP QUA MẠNG XÃ HỘI (ĐÃ CẬP NHẬT) ---
export const socialLoginCheck = CatchAsyncError(
  // <-- Dùng CatchAsyncError cho an toàn
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Gọi service để xử lý nghiệp vụ
    const serviceResponse = await socialAuthService(req.body);

    // 2. Kiểm tra tín hiệu trả về từ service
    if (serviceResponse.status === "success") {
      // --- Kịch bản 1: Đăng nhập thành công ---

      // Lấy userResponse đã được populate đầy đủ
      const user = serviceResponse.userResponse;

      console.log(user);

      // Nếu không có user, trả về lỗi an toàn
      if (!user) {
        return next(new ErrorHandler("User data is invalid", 500));
      }

      // *** MỤC TIÊU CỦA BẠN ĐÂY ***
      // Gọi sendToken, nó sẽ tự tạo token, set cookie và gửi response
      sendToken(user, 200, res);
    } else {
      // --- Kịch bản 2: Cần yêu cầu chọn Role ---
      // status là "ROLE_REQUIRED"
      // Trả về thông tin prefill cho frontend
      res.status(200).json(serviceResponse);
    }
  }
);

export const socialRegister = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Gọi service, service sẽ trả về IUserResponse (đã populate)
    // hoặc throw error (sẽ bị CatchAsyncError bắt lại)
    const user = await completeSocialRegisterService(
      req.body as ISocialAuthBody
    );

    // 2. *** MỤC TIÊU CỦA BẠN ĐÂY ***
    // Chuyển user và response cho sendToken
    // Sử dụng status code 201 (Created) cho việc đăng ký thành công

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

// reset mật khẩu
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy cả token và mật khẩu mới từ request body
    const { resetToken, newPassword } = req.body;

    // Luôn kiểm tra đầy đủ input
    if (!resetToken || !newPassword) {
      return next(
        new ErrorHandler("Token and new password are required.", 400)
      );
    }

    // Gọi service với token và password từ body
    const result = await resetPasswordService(resetToken, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return next(error); // Chuyển lỗi đến middleware xử lý lỗi
  }
};
