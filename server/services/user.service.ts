import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { Response } from "express";
import {
  INotificationSettingsData,
  IUpdateUserInfo,
} from "../types/user.types";
import { IUpdatePasswordParams } from "../types/auth.types";
import { UserRole } from "../models/user.model";
import { userRepository } from "../repositories/user.repository";

// --- LẤY USER BẰNG ID ---
export const getUserById = async (id: string) => {
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
    Object.assign(user.socials, data.socials);
  }

  await user.save();
  return user;
};

// --- CẬP NHẬT CÀI ĐẶT THÔNG BÁO ---
export const updateNotificationSettingsService = async (
  userId: string,
  data: INotificationSettingsData
) => {
  const updateFields: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateFields[`notificationSettings.${key}`] = value;
    }
  }
  if (Object.keys(updateFields).length === 0) {
    return { success: true, message: "No settings to update." };
  }

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
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    if (user.avatar && user.avatar.public_id) {
      try {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      } catch (destroyError: any) {
        console.error("Cloudinary old avatar deletion failed:", destroyError);
      }
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatarString, {
      folder: "avatars",
      width: 150,
      height: 150,
      crop: "fill",
    });

    user.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    await user.save();

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

export const deleteMyAccountService = async (id: string) => {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  // 1. Xóa profile tương ứng
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

  // 2. Xóa avatar trên Cloudinary
  if (user.avatar?.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  await userRepository.deleteUser(id);
};
