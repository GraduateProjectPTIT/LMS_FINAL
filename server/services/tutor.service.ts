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

// Cập nhật profile khi đăng ký
export type ICombinedTutorUserResponse = ReturnType<ITutor["toObject"]> &
  IUserResponse;

export const updateTutorExpertiseService = async (
  userId: string,
  data: IUpdateTutorExpertiseDto
): Promise<ICombinedTutorUserResponse> => {
  const { expertise } = data;

  if (!expertise || expertise.length === 0) {
    throw new ErrorHandler("Expertise is required for tutors.", 400);
  }

  const [user, tutorProfile] = await Promise.all([
    // Bỏ .select() ở đây vì hàm helper sẽ xử lý việc loại bỏ trường
    userModel.findById(userId),
    tutorModel.findOne({ userId }),
  ]);

  // Các logic kiểm tra và cập nhật vẫn giữ nguyên...
  if (!user) {
    throw new ErrorHandler("User not found.", 404);
  }
  if (!tutorProfile) {
    throw new ErrorHandler("Tutor profile not found.", 404);
  }

  // ... validation logic ...

  tutorProfile.expertise = expertise as unknown as Types.ObjectId[];
  if (user.isSurveyCompleted === false) {
    user.isSurveyCompleted = true;
  }

  await Promise.all([tutorProfile.save(), user.save()]);

  // ✨ SỬ DỤNG HÀM HELPER Ở ĐÂY ✨
  // 1. Sử dụng hàm helper để tạo response an toàn cho user
  const userResponse = _toUserResponse(user);

  // 2. Kết hợp tutor profile và user response đã được xử lý
  const combinedResponse = {
    ...tutorProfile.toObject(),
    ...userResponse,
  };

  return combinedResponse as ICombinedTutorUserResponse;
};
