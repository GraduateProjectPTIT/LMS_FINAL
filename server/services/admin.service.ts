// src/services/user.service.ts
import userModel, { IUser, UserRole } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { Request, Response } from "express";
// import { redis } from "../utils/redis";
import {
  IStudent,
  ITutor,
  IUpdateStudentInterestDto,
  IUpdateTutorExpertiseDto,
  IUpdateUserInfo,
} from "../types/user.types";
import { paginate, PaginationParams } from "../utils/pagination.helper"; // Import the helper
import {
  IUpdatePassword,
  IUpdatePasswordParams,
  IUserResponse,
} from "../types/auth.types";
import CategoryModel from "../models/category.model";
import { tutorModel } from "../models/tutor.model";
import { Types } from "mongoose";
import { studentModel } from "../models/student.model";
import { _toUserResponse } from "./auth.service";

// --- XÓA USER ---
// export const deleteUserService = async (id: string) => {
//   const user = await userModel.findById(id);
//   if (!user) {
//     throw new ErrorHandler("User not found", 404);
//   }
//   if (user.avatar?.public_id) {
//     await cloudinary.v2.uploader.destroy(user.avatar.public_id);
//   }
//   await user.deleteOne();
//   await redis.del(id);
// };

// --- LẤY TẤT CẢ USERS (đã có) ---
export const getAllUsersService = async (queryParams: PaginationParams) => {
  // Tách các tham số phân trang ra khỏi các tham số dùng để lọc
  const { page, limit, role } = queryParams; // 1. Xây dựng đối tượng filter

  const filter: { [key: string]: any } = {};
  if (role === "student" || role === "tutor") {
    filter.role = role;
  }

  const paginatedResult = await paginate(userModel, { page, limit }, filter); // 3. (Tùy chọn) Đổi tên key 'data' thành 'users' cho dễ hiểu ở controller

  return {
    paginatedResult,
  };
};
