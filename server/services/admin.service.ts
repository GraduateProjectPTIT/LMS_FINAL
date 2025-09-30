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
import {
  paginate,
  PaginationParams,
  UserQueryParams,
} from "../utils/pagination.helper"; // Import the helper
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
import { createKeywordSearchFilter } from "../utils/query.helper";

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
export const getAllUsersService = async (queryParams: UserQueryParams) => {
  const { page, limit, role, keyword, isVerified, isSurveyCompleted } =
    queryParams;

  if (role && !["student", "tutor"].includes(role)) {
    // Ném ra một lỗi, middleware CatchAsyncError sẽ bắt lỗi này
    throw new ErrorHandler(
      "Giá trị của role không hợp lệ. Chỉ chấp nhận 'student' hoặc 'tutor'.",
      400 // 400 Bad Request - lỗi từ phía người dùng
    );
  }

  if (isVerified && !["true", "false"].includes(isVerified)) {
    throw new ErrorHandler(
      "Giá trị của isVerified không hợp lệ. Chỉ chấp nhận 'true' hoặc 'false'.",
      400
    );
  }
  if (isSurveyCompleted && !["true", "false"].includes(isSurveyCompleted)) {
    throw new ErrorHandler(
      "Giá trị của isSurveyCompleted không hợp lệ. Chỉ chấp nhận 'true' hoặc 'false'.",
      400
    );
  }

  // 2. Build the base filter object
  const baseFilter: { [key: string]: any } = {};
  if (role === "student" || role === "tutor") {
    baseFilter.role = role;
  }

  if (isVerified !== undefined) {
    // Chuyển đổi chuỗi "true" thành boolean true, và ngược lại
    baseFilter.isVerified = isVerified === "true";
  }

  if (isSurveyCompleted !== undefined) {
    baseFilter.isSurveyCompleted = isSurveyCompleted === "true";
  }

  // 3. Generate the keyword search filter using the utility ✨
  const keywordFilter = createKeywordSearchFilter(keyword, ["email"]);

  // 4. Combine base filter and keyword filter
  const finalFilter = { ...baseFilter, ...keywordFilter };

  // 5. Pass the combined filter to the pagination function
  const paginatedResult = await paginate(
    userModel,
    { page, limit },
    finalFilter
  );

  return {
    paginatedResult,
  };
};
