// (Giả sử bạn đặt ở đầu file service hoặc import từ file DTO)
import { Schema } from "mongoose";

/**
 * 1. DTO (Data Transfer Object):
 * Định nghĩa cấu trúc dữ liệu trả về cho client/controller.
 */

export interface ICategoryInfo {
  _id: Schema.Types.ObjectId;
  title: string;
}

export interface ICourseTutorViewDto {
  _id: Schema.Types.ObjectId;
  name: string;
  thumbnail: { public_id?: string; url?: string };
  overview: string;
  categories: string[];
  price: number;
  estimatedPrice?: number;
  tags: string;
  level: string;
  ratings: number;
  purchased: number;

  // Các trường tính toán
  reviewsCount: number;
  courseDataCount: number;

  // Trường dùng để SẮP XẾP
  // Chúng ta cần đảm bảo các trường sort (như createdAt) có trong DTO
  createdAt?: Date;
}

/**
 * 2. Projection Object:
 * Đối tượng $project tương ứng 1:1 với DTO
 * Được sử dụng trực tiếp trong Aggregation Pipeline.
 */
export const courseTutorViewProjection: { [key: string]: any } = {
  // Các trường lấy trực tiếp từ model
  _id: 1,
  thumbnail: 1,
  name: 1,
  overview: 1,
  categories: "$categories.title",

  price: 1,
  estimatedPrice: 1,
  tags: 1,
  level: 1,
  ratings: 1,
  purchased: 1,

  // Các trường tính toán mới (dùng $size)
  reviewsCount: { $size: "$reviews" },
  courseDataCount: { $size: "$courseData" },

  // Quan trọng: Phải bao gồm TẤT CẢ các trường được phép SẮP XẾP
  // 'name', 'price', 'ratings', 'purchased' đã có ở trên.
  // Thêm 'createdAt' để đảm bảo sort "mới nhất" hoạt động.
  createdAt: 1,
};

/**
 * 3. Định nghĩa kiểu trả về phân trang
 */
export interface IPaginatedTutorCourseResult {
  data: ICourseTutorViewDto[];
  pagination: {
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}
