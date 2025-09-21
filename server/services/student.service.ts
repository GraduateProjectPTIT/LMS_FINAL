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

type IStudentDataObject = ReturnType<IStudent["toObject"]>;
export type ICombinedStudentUserResponse = IStudentDataObject & IUserResponse;

export const updateStudentInterestService = async (
  userId: string,
  data: IUpdateStudentInterestDto
): Promise<ICombinedStudentUserResponse> => {
  const { interests } = data;

  if (!interests) {
    throw new ErrorHandler("Interests field is required.", 400);
  }

  // Lấy user và student profile đồng thời
  const [user, studentProfile] = await Promise.all([
    userModel.findById(userId),
    studentModel.findOne({ userId }),
  ]);

  // Kiểm tra sự tồn tại của cả hai
  if (!user) {
    throw new ErrorHandler("User not found.", 404);
  }
  if (!studentProfile) {
    throw new ErrorHandler("Student profile not found.", 404);
  }

  // Xác thực các interest IDs
  if (interests.length > 0) {
    const categoryCount = await CategoryModel.countDocuments({
      _id: { $in: interests },
    });
    if (categoryCount !== interests.length) {
      throw new ErrorHandler("One or more interest IDs are invalid.", 400);
    }
  }

  // Cập nhật thông tin cho cả hai document
  studentProfile.interests = interests as unknown as Types.ObjectId[];
  if (user.isSurveyCompleted === false) {
    user.isSurveyCompleted = true;
  }

  // Lưu cả hai thay đổi đồng thời
  await Promise.all([studentProfile.save(), user.save()]);

  // Sử dụng hàm helper để tạo response an toàn cho user
  const userResponse = _toUserResponse(user);

  // Kết hợp thông tin từ studentProfile và userResponse
  const combinedResponse = {
    ...studentProfile.toObject(),
    ...userResponse,
  };

  return combinedResponse as ICombinedStudentUserResponse;
};
