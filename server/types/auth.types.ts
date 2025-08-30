// src/types/auth.types.ts

import { Types } from "mongoose";
import { UserRole } from "../models/user.model";

// Dùng trong quá trình tạo token kích hoạt
export interface IActivationToken {
  token: string;
  activationCode: string;
}

export interface IUserResponse {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  avatar: {
    public_id: string;
    url: string;
  };
  // ✅ Cập nhật ở đây
  isVerified: boolean;
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

export interface IDecodedPayload {
  id: string;
  iat: number;
  exp: number;
}

export interface IResetPasswordPayload {
  user: {
    id: string; // Chỉ cần lưu ID là đủ
  };
  resetToken: string; // truyền vào Token
}

export interface IResetPasswordToken {
  token: string;
  resetCode: string;
}

export interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// Dùng cho body của request đăng ký
export interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
}

// Dùng cho body của request kích hoạt tài khoản
export interface IActivationRequest {
  email: string;
  activation_code: string;
}

// Dùng cho body của request đăng nhập
export interface ILoginRequest {
  email: string;
  password: string;
}

// Dùng cho body của request đăng nhập qua mạng xã hội
export interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

// Dùng cho body của request đổi mật khẩu
export interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export interface IUpdatePasswordParams extends IUpdatePassword {
  userId: string;
}

export interface IResendCodeRequest {
  email: string;
}
