// src/types/user.types.ts
import { Document } from "mongoose";

// Interface chính cho User Model, kế thừa Document của Mongoose
// Đây là "nguồn chân lý" (source of truth) cho đối tượng User
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
}

// Dùng cho body của request cập nhật thông tin (tên, email)
export interface IUpdateUserInfo {
  name?: string;
  email?: string;
}
