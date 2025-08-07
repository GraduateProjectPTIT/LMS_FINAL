require("dotenv").config();
import { Response } from "express";
import { IUser } from "../types/user.types"; // Import từ file types
import { redis } from "./redis";
import { ITokenOptions } from "../types/auth.types";
import jwt from "jsonwebtoken";

// Lấy giá trị từ .env và chuyển sang số (tính bằng giây)
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
); // 300 giây = 5 phút
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "259200",
  10
); // 259200 giây = 3 ngày

// Options cho cookies
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 1000), // Sửa lại công thức
  maxAge: accessTokenExpire * 1000, // Sửa lại công thức
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 1000), // Sửa lại công thức
  maxAge: refreshTokenExpire * 1000, // Sửa lại công thức
  httpOnly: true,
  sameSite: "lax",
};

export const generateAccessToken = (user: IUser): string => {
  return jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "5m",
  });
};

export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  // Gọi đúng hàm generate... từ chính file này
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // upload session to redis
  redis.set(user._id as string, JSON.stringify(user));

  // only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
