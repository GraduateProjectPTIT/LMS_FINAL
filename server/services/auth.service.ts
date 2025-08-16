// src/services/auth.service.ts
import { Response } from "express";
import userModel, { IUser } from "../models/user.model";
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
  IResetPasswordToken,
  IResetPasswordPayload,
  IDecodedPayload,
} from "../types/auth.types";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

// --- HELPER: TẠO TOKEN KÍCH HOẠT ---
const createActivationToken = (user: IRegistrationBody): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: "30m" }
  );
  return { token, activationCode };
};

// --- RESET PASSWORD ---

export const createResetPasswordToken = (user: IUser): IResetPasswordToken => {
  // Tạo mã code 4 chữ số ngẫu nhiên
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Tạo JWT, chỉ chứa ID của user và mã code
  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.RESET_PASSWORD_SECRET as Secret, // !! Dùng một SECRET KEY khác để tăng bảo mật
    { expiresIn: "1h" } // Đặt thời gian hết hạn
  );

  return { token, resetCode };
};

export const forgotPasswordService = async (email: string) => {
  const user = await userModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      message: `Email is invalid`,
    };
  }

  // 2. Tạo token và mã code reset
  const resetTokenData = createResetPasswordToken(user);
  const resetToken = resetTokenData.token;

  // cập nhật resetToken
  user.resetToken = resetToken;
  await user.save();

  // 3. Chuẩn bị dữ liệu cho email template
  const data = {
    user: { name: user.name }, // Lấy tên user từ DB
    resetToken: resetToken,
  };

  const templatePath = path.join(__dirname, "../mails/reset-password-mail.ejs");

  // 4. Render và gửi email (logic giống hệt của bạn)
  // Bạn sẽ cần tạo một file template mới là `reset-password-mail.ejs`
  await ejs.renderFile(templatePath, data);

  try {
    await sendMail({
      email,
      subject: "Reset your password",
      template: "reset-password-mail.ejs", // Dùng template mới
      data,
    });

    // 5. Trả về token và thông báo thành công
    // Trả về token tương tự như luồng register
    return {
      success: true,
      message: `Please check your email: ${email} for your password reset code!`,
      resetToken: resetToken, // Trả về JWT chứa thông tin reset
    };
  } catch (error: any) {
    throw new ErrorHandler(error.message, 400);
  }
};

export const resetPasswordService = async (
  resetToken: string, // Đây chính là JWT từ URL
  newPassword: string
): Promise<{ message: string }> => {
  try {
    const decoded = jwt.verify(
      resetToken,
      process.env.RESET_PASSWORD_SECRET as string
    ) as IDecodedPayload;
    const user = await userModel.findOne({ resetToken: resetToken });

    // 2. Nếu không tìm thấy, token không hợp lệ hoặc đã được sử dụng
    if (!user) {
      throw new ErrorHandler(
        "Password reset token is invalid or has already been used.",
        400
      );
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.resetToken = undefined;

    // Dòng `user.resetToken = undefined;` đã được XÓA BỎ
    // vì chúng ta không lưu token trong user model nữa.

    await user.save();

    return { message: "Password has been reset successfully." };
  } catch (error) {
    console.log(error);
    throw new ErrorHandler(
      "Password reset token is invalid or has expired.",
      400
    );
  }
};

// --- NGHIỆP VỤ ĐĂNG KÝ ---
export const registerUserService = async (body: IRegistrationBody) => {
  const { name, email, password, confirmPassword } = body;
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    throw new ErrorHandler("Email already exists", 400);
  }

  if (password !== confirmPassword) {
    throw new ErrorHandler("Passwords do not match", 400);
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

  await userModel.create({ name, email, password, isVerified: true });
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
  }

  // ✔️ Thay đổi: Chuyển đổi Mongoose document thành plain object
  const userObject = user.toObject();

  // ✅ Thay thế `delete` bằng cú pháp này
  const { password: hashedPassword, ...userWithoutPassword } = userObject;

  return userWithoutPassword;
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
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

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
