import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { updateAccessToken } from "../controllers/auth.controller";
import userModel from "../models/user.model";
import { updateAccessTokenService } from "../services/auth.service";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt";

// authenticated user
// isAuthenticated đã được sửa lại
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    // --- Helper function để làm mới token và đi tiếp ---
    const refreshAndContinue = async () => {
      try {
        const refresh_token_from_cookie = req.cookies.refresh_token as string;
        if (!refresh_token_from_cookie) {
          return next(
            new ErrorHandler("Please login to access this resource", 401)
          );
        }

        // 1. Gọi SERVICE (chứa logic nghiệp vụ), không gọi controller
        const { user, accessToken, refreshToken } =
          await updateAccessTokenService(refresh_token_from_cookie);

        // 2. Middleware tự set lại cookie mới
        req.user = user;
        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        // 3. QUAN TRỌNG: Cho request đi tiếp vào controller ban đầu (ví dụ: /me)
        next();
      } catch (error) {
        // Nếu làm mới thất bại (refresh token sai, hết hạn...), yêu cầu đăng nhập lại
        return next(
          new ErrorHandler("Could not refresh session, please login again", 401)
        );
      }
    };

    // --- Logic chính của Middleware ---

    // Kịch bản 1: Không có access_token
    if (!access_token) {
      return await refreshAndContinue();
    }

    // Kịch bản 2: Có access_token, xác thực nó
    try {
      // FIX BẢO MẬT: Dùng jwt.verify để kiểm tra chữ ký
      const decoded = jwt.verify(
        access_token,
        process.env.ACCESS_TOKEN! // Đảm bảo key này đúng với key khi tạo token
      ) as JwtPayload;

      const user = await userModel.findById(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      req.user = user;
      next(); // Cho đi tiếp nếu token hợp lệ
    } catch (error: any) {
      // Kịch bản 3: Token hết hạn
      if (error.name === "TokenExpiredError") {
        return await refreshAndContinue();
      }
      // Các lỗi khác (token không hợp lệ, chữ ký sai)
      return next(new ErrorHandler("Access token is invalid", 401));
    }
  }
);

// validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
