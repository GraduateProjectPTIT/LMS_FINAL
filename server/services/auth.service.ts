// src/services/auth.service.ts
import { Response } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import sendMail from "../utils/sendMail";
import path from "path";
import ejs from "ejs";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { redis } from "../utils/redis";
import {
  IActivationRequest,
  IActivationToken,
  IRegistrationBody,
  ISocialAuthBody,
  IUpdatePassword, // IUpdatePasswordService was renamed to IUpdatePassword
  ILoginRequest,
} from "../types/auth.types";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

// --- HELPER: TẠO TOKEN KÍCH HOẠT ---
const createActivationToken = (user: IRegistrationBody): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: "5m" }
  );
  return { token, activationCode };
};

// --- NGHIỆP VỤ ĐĂNG KÝ ---
export const registerUserService = async (body: IRegistrationBody) => {
  const { name, email, password } = body;
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    throw new ErrorHandler("Email already exists", 400);
  }

  const activationTokenData = createActivationToken({ name, email, password });
  const data = {
    user: { name },
    activationCode: activationTokenData.activationCode,
  };

  // Render email template (không cần chờ)
  ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);
  try {
    // Gửi email kích hoạt
    await sendMail({
      email,
      subject: "Activate your account",
      template: "activation-mail.ejs",
      data,
    });
    return {
      success: true,
      message: `Please check your email: ${email} to activate your account!`,
      activationToken: activationTokenData.token,
    };
  } catch (error: any) {
    throw new ErrorHandler(error.message, 400);
  }
};

// --- NGHIỆP VỤ KÍCH HOẠT USER ---
export const activateUserService = async (body: IActivationRequest) => {
  const { activation_token, activation_code } = body;
  const decodedToken = jwt.verify(
    activation_token,
    process.env.ACTIVATION_SECRET as string
  ) as { user: IRegistrationBody; activationCode: string };

  if (decodedToken.activationCode !== activation_code) {
    throw new ErrorHandler("Invalid activation code", 400);
  }

  const { name, email, password } = decodedToken.user;
  const existUser = await userModel.findOne({ email });
  if (existUser) {
    throw new ErrorHandler("Email already exists", 400);
  }

  await userModel.create({ name, email, password });
};

// --- NGHIỆP VỤ ĐĂNG NHẬP ---
export const loginUserService = async (body: ILoginRequest) => {
  const { email, password } = body;
  if (!email || !password) {
    throw new ErrorHandler("Please enter email and password", 400);
  }
  const user = await userModel.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ErrorHandler("Invalid email or password", 400);
  } // ✔️ Thay đổi: Chỉ trả về user, không tạo token ở đây nữa

  return user;
};

// --- NGHIỆP VỤ ĐĂNG NHẬP MẠNG XÃ HỘI ---
export const socialAuthService = async (body: ISocialAuthBody) => {
  const { email, name, avatar } = body;
  let user = await userModel.findOne({ email });
  if (!user) {
    // Kịch bản 1: Người dùng mới
    user = await userModel.create({
      email,
      name,
      avatar: {
        public_id: "default_id", // Hoặc một ID mặc định nếu bạn muốn
        url: avatar,
      },
    });
  } else {
    // Kịch bản 2: Người dùng đã tồn tại -> Kiểm tra và cập nhật avatar
    if (user.avatar?.url !== avatar) {
      user.avatar = {
        // Giữ lại public_id cũ để có thể xóa ảnh cũ trên Cloudinary nếu cần
        public_id: user.avatar?.public_id || "",
        url: avatar, // Cập nhật url mới
      };
      await user.save(); // Đừng quên lưu lại thay đổi
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // await redis.set(user._id.toString(), JSON.stringify(user));

  return { user, accessToken, refreshToken };
};

// --- NGHIỆP VỤ ĐĂNG XUẤT ---
export const logoutUserService = async (res: Response, userId: string) => {
  res.cookie("access_token", "", { maxAge: 1 });
  res.cookie("refresh_token", "", { maxAge: 1 });

  return "Logged out successfully";
};

// --- NGHIỆP VỤ LÀM MỚI TOKEN ---
export const updateAccessTokenService = async (token: string) => {
  if (!token) {
    throw new ErrorHandler("Could not refresh token", 400);
  }
  const decoded = jwt.verify(
    token,
    process.env.REFRESH_TOKEN as string
  ) as JwtPayload;

  const user = await userModel.findById(decoded.id);

  if (!user) {
    throw new ErrorHandler("User not found, please login again", 400);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};

// --- NGHIỆP VỤ CẬP NHẬT MẬT KHẨU ---
// export const updatePasswordService = async (data: IUpdatePassword) => {
//   const { userId, oldPassword, newPassword } = data;
//   const user = await userModel.findById(userId).select("+password");
//   if (!user) {
//     throw new ErrorHandler("Invalid user", 400);
//   }
//   const isPasswordMatch = await user.comparePassword(oldPassword);
//   if (!isPasswordMatch) {
//     throw new ErrorHandler("Invalid old password", 400);
//   }
//   user.password = newPassword;
//   await user.save();

//   // [REDIS] Sau khi cập nhật thông tin quan trọng, cập nhật lại cache trong Redis.
//   await redis.set(userId, JSON.stringify(user));
// };
