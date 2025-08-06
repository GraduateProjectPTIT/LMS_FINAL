// src/services/user.service.ts
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { redis } from "../utils/redis";
import { IUpdateUserInfo } from "../types/user.types";

// --- LẤY USER BẰNG ID (đã có) ---
export const getUserById = async (id: string) => {
  const userJson = await redis.get(id);
  if (userJson) {
    return JSON.parse(userJson);
  }
  const user = await userModel.findById(id);
  if (user) {
    await redis.set(id, JSON.stringify(user));
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
  if (data.email) {
    const isEmailExist = await userModel.findOne({ email: data.email });
    if (isEmailExist && isEmailExist._id.toString() !== userId) {
      throw new ErrorHandler("Email already exists", 400);
    }
    user.email = data.email;
  }
  if (data.name) {
    user.name = data.name;
  }
  await user.save();
  await redis.set(userId, JSON.stringify(user));
  return user;
};

// --- CẬP NHẬT ẢNH ĐẠI DIỆN ---
export const updateProfilePictureService = async (
  userId: string,
  file: Express.Multer.File | undefined
) => {
  if (!file) {
    throw new ErrorHandler("No file provided", 400);
  }
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }
  if (user.avatar?.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  const result = await new Promise<cloudinary.UploadApiResponse>(
    (resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: "avatars", width: 150, crop: "scale" },
        (error, result) => {
          if (result) resolve(result);
          else reject(error || new Error("Cloudinary upload failed"));
        }
      );
      uploadStream.end(file.buffer);
    }
  );

  user.avatar = { public_id: result.public_id, url: result.secure_url };
  await user.save();
  await redis.set(userId, JSON.stringify(user));
  return user;
};

// --- LẤY TẤT CẢ USERS (đã có) ---
export const getAllUsersService = async () => {
  return await userModel.find().sort({ createdAt: -1 });
};

// --- CẬP NHẬT VAI TRÒ (đã có) ---
export const updateUserRoleService = async (id: string, role: string) => {
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }
  await redis.set(id, JSON.stringify(user));
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
  await redis.del(id);
};
