require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
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
  secure: false,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 1000), // Sửa lại công thức
  maxAge: refreshTokenExpire * 1000, // Sửa lại công thức
  httpOnly: true,
  secure: false,
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
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
