// src/services/user.service.ts
import userModel, { IUser, UserRole } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { Request, Response } from "express";
import { redis } from "../utils/redis";
import {
  INotificationSettingsData,
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
import { adminModel } from "../models/admin.model";
import { sendEventToUser } from "../utils/sseManager";
import { createAndSendNotification } from "./notification.service";

// --- LẤY USER BẰNG ID (đã có) ---
export const getUserById = async (id: string) => {
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  const user = await userModel.findById(id);
  if (user) {
    await redis.set(`user:${id}`, JSON.stringify(user), "EX", 1800);
  }
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
  await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 1800);
  return user;
};

export const updateNotificationSettingsService = async (
  userId: string,
  data: INotificationSettingsData
) => {
  // Vì tất cả cài đặt đều nằm trong userModel,
  // chúng ta có thể dùng một lệnh `updateOne` rất hiệu quả.

  // 1. Tạo object $set
  // Nó sẽ tự động build một object kiểu:
  // { "notificationSettings.on_new_lesson": true, "notificationSettings.on_reply_comment": false }
  const updateFields: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateFields[`notificationSettings.${key}`] = value;
    }
  }

  // 2. Kiểm tra nếu không có gì để cập nhật
  if (Object.keys(updateFields).length === 0) {
    return { success: true, message: "No settings to update." };
  }

  // 3. Cập nhật bằng $set để không ghi đè toàn bộ object
  const user = await userModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  );

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 1800); // Cập nhật redis nếu cần
  return user;
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
    await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 1800);

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      user,
    });
  } catch (error: any) {
    throw new ErrorHandler(error.message, 500);
  }
};

// --- CẬP NHẬT VAI TRÒ (đã có) ---
export const updateUserRoleService = async (id: string, role: string) => {
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }
  await redis.set(`user:${id}`, JSON.stringify(user), "EX", 1800);
  return user;
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

  // 1. Xóa profile tương ứng với role của user
  switch (user.role) {
    case UserRole.Student:
      if (user.studentProfile) {
        await studentModel.findByIdAndDelete(user.studentProfile);
      }
      break;
    case UserRole.Tutor:
      if (user.tutorProfile) {
        await tutorModel.findByIdAndDelete(user.tutorProfile);
      }
      break;
    case UserRole.Admin:
      if (user.adminProfile) {
        await adminModel.findByIdAndDelete(user.adminProfile);
      }
      break;
    default:
      break;
  }

  // 2. Xóa avatar trên Cloudinary nếu có (giữ nguyên)
  if (user.avatar?.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  // 3. Xóa người dùng khỏi database (giữ nguyên)
  await user.deleteOne();
};
