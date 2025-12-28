// src/services/user.service.ts
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { Response } from "express";
import {
  INotificationSettingsData,
  IUpdateUserInfo,
} from "../types/user.types";
import { IUpdatePasswordParams } from "../types/auth.types";
import { UserRole } from "../models/user.model";
import { userRepository } from "../repositories/user.repository"; // Import Repository

// --- LẤY USER BẰNG ID ---
export const getUserById = async (id: string) => {
  // Sử dụng repo thay vì userModel.findById
  const user = await userRepository.findById(id);
  return user;
};

// --- CẬP NHẬT THÔNG TIN USER ---
export const updateUserInfoService = async (
  userId: string,
  data: IUpdateUserInfo
) => {
  const user = await userRepository.findById(userId);
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
    // Vì user lấy từ findById là Mongoose Document, ta vẫn dùng được cú pháp này
    Object.assign(user.socials, data.socials);
  }

  // Gọi save() trên document instance để kích hoạt các pre-save hooks (nếu có)
  await user.save();
  return user;
};

// --- CẬP NHẬT CÀI ĐẶT THÔNG BÁO ---
export const updateNotificationSettingsService = async (
  userId: string,
  data: INotificationSettingsData
) => {
  // 1. Tạo object $set logic vẫn giữ ở service vì đây là xử lý input data
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

  // 3. Gọi Repository để update
  const user = await userRepository.updateNotificationSettings(
    userId,
    updateFields
  );

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

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
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    // 2. --- DELETE OLD AVATAR IF IT EXISTS ---
    if (user.avatar && user.avatar.public_id) {
      try {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      } catch (destroyError: any) {
        console.error("Cloudinary old avatar deletion failed:", destroyError);
      }
    }

    // 3. --- UPLOAD NEW AVATAR ---
    const myCloud = await cloudinary.v2.uploader.upload(avatarString, {
      folder: "avatars",
      width: 150,
      height: 150,
      crop: "fill",
    });

    // 4. --- UPDATE USER RECORD ---
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

// --- CẬP NHẬT VAI TRÒ ---
export const updateUserRoleService = async (id: string, role: string) => {
  const user = await userRepository.updateUserRole(id, role);
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }
  return user;
};

// --- NGHIỆP VỤ CẬP NHẬT MẬT KHẨU ---
export const updatePasswordService = async (data: IUpdatePasswordParams) => {
  const { userId, oldPassword, newPassword } = data;

  // Dùng hàm riêng của repo để lấy password field
  const user = await userRepository.findUserWithPassword(userId);
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
  const user = await userRepository.findById(id);

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  // 1. Xóa profile tương ứng thông qua Repository helper
  let profileIdToDelete: string | undefined;

  switch (user.role) {
    case UserRole.Student:
      profileIdToDelete = user.studentProfile?.toString();
      break;
    case UserRole.Tutor:
      profileIdToDelete = user.tutorProfile?.toString();
      break;
    case UserRole.Admin:
      profileIdToDelete = user.adminProfile?.toString();
      break;
  }

  if (profileIdToDelete) {
    await userRepository.deleteRelatedProfile(user.role, profileIdToDelete);
  }

  // 2. Xóa avatar trên Cloudinary nếu có (giữ nguyên logic service)
  if (user.avatar?.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  await userRepository.deleteUser(id);
};
