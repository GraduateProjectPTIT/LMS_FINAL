import { UserRole } from "../models/user.model";
import { Document, Types } from "mongoose";

// Dùng cho body của request cập nhật thông tin (tên, email)
export interface IUpdateUserInfo {
  name?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
}

export interface ISetupProfileDto {
  role?: UserRole;
  expertise?: string[]; // Mảng các ID của Category, là optional
}

// Interface cho các vai trò cụ thể
export interface IStudent extends Document {
  userId: Types.ObjectId;
  interests?: string[];
  // Thêm các trường khác của student ở đây...
}

export interface ITutor extends Document {
  userId: Types.ObjectId;
  expertise: Types.ObjectId[];
  // Thêm các trường khác của tutor ở đây...
}

export interface IAdmin extends Document {
  userId: Types.ObjectId;
  lastActivity?: Date;
}
