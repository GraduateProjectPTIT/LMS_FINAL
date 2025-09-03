import { UserRole } from "../models/user.model";

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
