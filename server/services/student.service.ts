// src/services/user.service.ts
import userModel, { IUser, UserRole } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { Request, Response } from "express";
import { redis } from "../utils/redis";
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
import CategoryModel, { ICategory } from "../models/category.model";
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

  // BƯỚC 1: Lấy user và student profile
  const [user, studentProfile] = await Promise.all([
    userModel.findById(userId),
    studentModel.findOne({ userId }),
  ]);

  if (!user || !studentProfile) {
    throw new ErrorHandler("User or Student profile not found.", 404);
  }

  // (Optional but recommended) Xác thực các interest IDs
  if (interests.length > 0) {
    const categoryCount = await CategoryModel.countDocuments({
      _id: { $in: interests },
    });
    if (categoryCount !== interests.length) {
      throw new ErrorHandler("One or more interest IDs are invalid.", 400);
    }
  }

  // BƯỚC 2: Cập nhật và lưu vào database
  studentProfile.interests = interests as unknown as Types.ObjectId[];
  if (user.isSurveyCompleted === false) {
    user.isSurveyCompleted = true;
  }
  await Promise.all([studentProfile.save(), user.save()]);

  // ✨ BẮT ĐẦU CHUẨN BỊ RESPONSE GIỐNG HỆT LOGIC TUTOR ✨

  // 3. Populate trường 'interests' sau khi đã lưu
  const populatedProfile = await studentProfile.populate<{
    interests: ICategory[];
  }>("interests");

  // 4. Map để lấy ra mảng các tên sở thích (string[])
  let interestTitles: string[] = [];
  if (populatedProfile && populatedProfile.interests) {
    interestTitles = populatedProfile.interests.map(
      (category) => category.title
    );
  }

  // 5. Chuẩn bị các phần của response
  const userResponse = _toUserResponse(user);
  // Tách userId ra và lấy phần còn lại của student profile
  const { userId: removedUserId, ...restOfProfile } =
    populatedProfile.toObject();

  // 6. Kết hợp lại để có response cuối cùng
  const combinedResponse = {
    ...restOfProfile,
    ...userResponse,
    interests: interestTitles, // Ghi đè trường interests bằng mảng các title
  };

  return combinedResponse as ICombinedStudentUserResponse;
};
