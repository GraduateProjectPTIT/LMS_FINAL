// src/utils/pagination.helper.ts

import { Model, FilterQuery } from "mongoose";

// NEW: Thêm một interface cho tùy chọn sắp xếp
export interface SortOptions {
  [key: string]: 1 | -1 | "asc" | "desc";
}

// Các interface này giữ nguyên
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface PaginationParams {
  page?: string;
  limit?: string;
}

// UserQueryParams giữ nguyên
export interface UserQueryParams extends PaginationParams {
  role?: "student" | "tutor";
  keyword?: string;
  isVerified?: string;
  isSurveyCompleted?: string;
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}

export type CourseLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "All Levels";

export interface CourseQueryParams extends PaginationParams {
  keyword?: string;
  level?: CourseLevel;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Bạn có thể thêm các filter khác ở đây, ví dụ: categoryId?: string
}

/**
 * Hàm phân trang có thể tái sử dụng cho các Mongoose query.
 * @param model - Mongoose model để phân trang.
 * @param params - Các tham số truy vấn cho page và limit.
 * @param filter - (Tùy chọn) Đối tượng filter của Mongoose (mệnh đề 'where').
 * @param sort - (Tùy chọn) Đối tượng để sắp xếp kết quả.
 */
export async function paginate<T>(
  model: Model<T>,
  params: PaginationParams,
  filter: FilterQuery<T> = {},
  // CHANGED: Thêm tham số 'sort' với giá trị mặc định
  sort: SortOptions = { createdAt: -1 }
): Promise<PaginatedResult<T>> {
  // 1. Lấy giá trị page và limit với giá trị mặc định
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;

  // 2. Thực thi các query song song
  const [data, totalItems] = await Promise.all([
    model
      .find(filter)
      // CHANGED: Thay thế sort cứng bằng tham số 'sort' động
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec(),
    model.countDocuments(filter).exec(),
  ]);

  // 3. Tính toán tổng số trang
  const totalPages = Math.ceil(totalItems / limit);

  // 4. Trả về kết quả có cấu trúc
  return {
    data,
    meta: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
}
