// src/services/user.service.ts
import userModel, { IUser, UserRole } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { Request, Response } from "express";
// import { redis } from "../utils/redis";
import { userRepository } from "../repositories/user.repository";
import { orderRepository } from "../repositories/order.repository";
import { enrolledCourseRepository } from "../repositories/enrolledCourse.repository";
import { courseRepository } from "../repositories/course.repository";
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
import { SortOptions } from "../utils/pagination.helper";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";
import { redis } from "../utils/redis";
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

// Admin dashboard summary
export const getAdminDashboardSummaryService = async () => {
  const cached = await redis.get("admin:dashboard:summary");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  const [
    totalUsers,
    totalTutors,
    totalStudents,
    totalCourses,
    paidOrdersAgg,
    recentUsers,
    recentPaidOrders,
  ] = await Promise.all([
    userModel.countDocuments({}),
    userModel.countDocuments({ role: "tutor" }),
    userModel.countDocuments({ role: "student" }),
    CourseModel.countDocuments({}),
    OrderModel.aggregate([
      { $match: { "payment_info.status": { $in: ["succeeded", "paid"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $ifNull: ["$payment_info.amount", { $ifNull: ["$total", 0] }],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    userModel
      .find({})
      .select("name email avatar createdAt role")
      .sort({ createdAt: -1 })
      .limit(5),
    OrderModel.find({ "payment_info.status": { $in: ["succeeded", "paid"] } })
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const totalOrders =
    Array.isArray(paidOrdersAgg) && paidOrdersAgg.length
      ? paidOrdersAgg[0].count
      : 0;
  const totalRevenue =
    Array.isArray(paidOrdersAgg) && paidOrdersAgg.length
      ? paidOrdersAgg[0].totalRevenue
      : 0;

  const result = {
    summary: {
      totalUsers,
      totalTutors,
      totalStudents,
      totalCourses,
      totalOrders,
      totalRevenue,
    },
    recentUsers,
    recentPaidOrders,
  };
  try {
    await redis.set("admin:dashboard:summary", JSON.stringify(result), "EX", 120);
  } catch {}
  return result;
};

// Admin revenue chart
export const getAdminRevenueChartService = async (range: string = "30d") => {
  const cacheKey = `admin:revenue:${range}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  const isMonthly = range === "12m";
  const matchStage = {
    "payment_info.status": { $in: ["succeeded", "paid"] },
  } as any;
  const groupId = isMonthly
    ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }
    : {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };

  const data = await OrderModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupId,
        revenue: {
          $sum: {
            $ifNull: ["$payment_info.amount", { $ifNull: ["$total", 0] }],
          },
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        ...(isMonthly ? {} : { "_id.day": 1 }),
      },
    },
  ]);

  const result = { range, series: data };
  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", 120);
  } catch {}
  return result;
};

// --- LẤY TẤT CẢ USERS (đã có) ---
// Đảm bảo bạn import SortOptions từ file helper

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

export const adminCreateEnrollmentService = async (
  userId: string,
  courseId: string
) => {
  const userIdObj = new Types.ObjectId(userId);
  const courseIdObj = new Types.ObjectId(courseId);

  // 2. Kiểm tra sự tồn tại (User, Course, và Enrollment) song song
  const [userExists, courseExists, existingEnrollment] = await Promise.all([
    userRepository.findSimpleById(userIdObj),
    courseRepository.findSimpleById(courseIdObj),
    enrolledCourseRepository.findByUserAndCourse(userIdObj, courseIdObj),
  ]);

  // 3. Xử lý kết quả validation
  if (!userExists) {
    throw new ErrorHandler("Không tìm thấy người dùng với ID này.", 404);
  }
  if (!courseExists) {
    throw new ErrorHandler("Không tìm thấy khóa học với ID này.", 404);
  }
  if (existingEnrollment) {
    throw new ErrorHandler("Học viên này đã được ghi danh vào khóa học.", 409); // 409 Conflict
  }

  // 4. Tạo bản ghi mới VÀ cập nhật số lượt mua của khóa học
  const [newEnrollment] = await Promise.all([
    enrolledCourseRepository.create(userIdObj, courseIdObj),
  ]);

  return newEnrollment;
};
