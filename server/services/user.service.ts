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

// --- LẤY USER BẰNG ID (đã có) ---
export const getUserById = async (id: string) => {
  // const userJson = await redis.get(id);
  // if (userJson) {
  //   return JSON.parse(userJson);
  // }
  const user = await userModel.findById(id);
  // if (user) {
  //   await redis.set(id, JSON.stringify(user));
  // }
  return user;
};

// --- CẬP NHẬT THÔNG TIN USER ---
export const updateUserInfoService = async (
  userId: string,
  data: IUpdateUserInfo
) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  if (data.bio) {
    if (data.bio.length > 500) {
      throw new ErrorHandler("Bio cannot be longer than 500 characters", 400);
    }
    user.bio = data.bio;
  }

  if (data.name) {
    user.name = data.name;
  }
  if (data.socials) {
    Object.assign(user.socials, data.socials);
  }
  await user.save();
  // await redis.set(userId, JSON.stringify(user));
  return user;
};

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

// --- CẬP NHẬT ẢNH ĐẠI DIỆN ---
export const updateAvatarService = async (
  userId: string,
  avatarString: string, // base64
  res: Response
) => {
  try {
    // 1. --- FIND USER ---
    const user = await userModel.findById(userId);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    // 2. --- DELETE OLD AVATAR IF IT EXISTS ---
    // If the user already has an avatar with a public_id, destroy it
    if (user.avatar && user.avatar.public_id) {
      try {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      } catch (destroyError: any) {
        console.error("Cloudinary old avatar deletion failed:", destroyError);
      }
    }

    // 3. --- UPLOAD NEW AVATAR ---
    // Upload the new base64 string image to Cloudinary
    const myCloud = await cloudinary.v2.uploader.upload(avatarString, {
      // Use the renamed variable
      folder: "avatars",
      width: 150,
      height: 150,
      crop: "fill",
    });

    // 4. --- UPDATE USER RECORD ---
    // Update the user's avatar object, matching the IUser interface
    user.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    await user.save();

    // 5. --- SEND RESPONSE ---
    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      user,
    });
  } catch (error: any) {
    throw new ErrorHandler(error.message, 500);
  }
};

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

// --- CẬP NHẬT VAI TRÒ (đã có) ---
export const updateUserRoleService = async (id: string, role: string) => {
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }
  // await redis.set(id, JSON.stringify(user));
  return user;
};

// --- XÓA USER ---
export const deleteUserService = async (id: string) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }
  // Cần thêm logic xóa avatar trên cloudinary nếu có
  if (user.avatar?.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }
  await user.deleteOne();
  // await redis.del(id);
};

// --- NGHIỆP VỤ CẬP NHẬT MẬT KHẨU ---
export const updatePasswordService = async (data: IUpdatePasswordParams) => {
  const { userId, oldPassword, newPassword } = data;

  const user = await userModel.findById(userId).select("+password");
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  const isPasswordMatch = await user.comparePassword(oldPassword);
  if (!isPasswordMatch) {
    throw new ErrorHandler("Invalid old password", 400);
  }

  user.password = newPassword;
  await user.save();
};

// --- NGHIỆP VỤ TỰ XÓA TÀI KHOẢN ---

export const deleteMyAccountService = async (id: string) => {
  const user = await userModel.findById(id);

  if (!user) {
    // Trường hợp này hiếm khi xảy ra vì user đã được xác thực
    throw new ErrorHandler("User not found", 404);
  }

  // 1. Xóa avatar trên Cloudinary nếu có
  if (user.avatar?.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  // 2. Xóa người dùng khỏi database
  await user.deleteOne();
};
