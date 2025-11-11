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
  bio?: string;
}

export interface IUpdateTutorExpertiseDto {
  expertise: string[];
}

// DTO cho việc cập nhật interests của Student
export interface IUpdateStudentInterestDto {
  interests: string[];
}

export interface INotificationSettingsData {
  on_reply_comment?: boolean;
  on_payment_success?: boolean;
  on_new_student?: boolean;
  on_new_review?: boolean;
}

// Interface cho các vai trò cụ thể
export interface IStudent extends Document {
  userId: Types.ObjectId;
  interests?: Types.ObjectId[];
  // Thêm các trường khác của student ở đây...
}

export interface ITutor extends Document {
  userId: Types.ObjectId;
  expertise?: Types.ObjectId[];
  // Thêm các trường khác của tutor ở đây...
}

export interface IAdmin extends Document {
  userId: Types.ObjectId;
  lastActivity?: Date;
}
