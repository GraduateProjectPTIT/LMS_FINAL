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
// Đảm bảo bạn import SortOptions từ file helper
import { SortOptions } from "../utils/pagination.helper";
import { userRepository } from "../repositories/user.repository";
import { orderRepository } from "../repositories/order.repository";
import { enrolledCourseRepository } from "../repositories/enrolledCourse.repository";
import { courseRepository } from "../repositories/course.repository";

export const getAllUsersService = async (queryParams: UserQueryParams) => {
  const {
    page,
    limit,
    role,
    keyword,
    isVerified,
    isSurveyCompleted,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = queryParams;

  // ... (toàn bộ phần validation của bạn giữ nguyên) ...

  const allowedSortFields = ["createdAt", "name"];
  if (!allowedSortFields.includes(sortBy)) {
    throw new ErrorHandler(
      "Giá trị của sortBy không hợp lệ. Chỉ chấp nhận 'createdAt' hoặc 'name'.",
      400
    );
  }

  // --- Phần build filter của bạn ---
  const baseFilter: { [key: string]: any } = {};
  if (role) {
    baseFilter.role = role;
  }
  if (isVerified !== undefined) {
    baseFilter.isVerified = isVerified === "true";
  }
  if (isSurveyCompleted !== undefined) {
    baseFilter.isSurveyCompleted = isSurveyCompleted === "true";
  }

  const keywordFilter = createKeywordSearchFilter(keyword, ["name", "email"]);
  const finalFilter = { ...baseFilter, ...keywordFilter };

  // 3. TẠO ĐỐI TƯỢNG sort CHO MONGOOSE VỚI CHÚ THÍCH KIỂU
  const sortOptions: SortOptions = {
    // <--- ĐÂY LÀ DÒNG ĐÃ SỬA
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  // 4. TRUYỀN TÙY CHỌN SẮP XẾP VÀO HÀM `paginate`
  const paginatedResult = await paginate(
    userModel,
    { page, limit },
    finalFilter,
    sortOptions
  );

  return {
    paginatedResult,
  };
};

export const getUserDetailService = async (userId: string) => {
  const user = await userRepository.findUserDetailById(userId);

  if (!user) {
    throw new ErrorHandler("Không tìm thấy người dùng.", 404);
  }

  const userObject = user.toObject();

  switch (user.role) {
    case UserRole.Student: {
      const [totalSpent, enrolledCoursesCount] = await Promise.all([
        orderRepository.getTotalSpentByStudent(user._id),
        enrolledCourseRepository.countEnrolledCoursesByStudent(user._id),
      ]);

      return {
        ...userObject,
        enrolledCoursesCount, // <-- Giá trị đúng
        totalSpent,
      };
    }

    case UserRole.Tutor: {
      const tutorStats = await courseRepository.getTutorStatistics(user._id);
      return {
        ...userObject,
        ...tutorStats,
      };
    }

    default:
      return userObject;
  }
};
