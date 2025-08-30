// Dùng cho body của request cập nhật thông tin (tên, email)
export interface IUpdateUserInfo {
  name?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
}
