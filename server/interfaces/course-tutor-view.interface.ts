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

export interface ICourseCardDto {
  _id: Schema.Types.ObjectId;
  thumbnail: {
    url: string;
  };
  name: string;
  price: number;
  estimatedPrice: number;
  enrolledCounts: number;
  totalLectures: number;
  totalDuration: number;
}

/**
 * 2. Projection Object:
 * Đối tượng $project tương ứng 1:1 với DTO
 * Được sử dụng trực tiếp trong Aggregation Pipeline.
 */
export const courseListProjection = {
  _id: 1,
  thumbnail: {
    url: { $ifNull: ["$thumbnail.url", ""] },
  },
  name: 1,
  price: 1,
  estimatedPrice: 1,
  enrolledCounts: "$purchased", // Đổi tên từ purchased

  // TÍNH TOÁN LẠI DỰA TRÊN MODEL MỚI
  totalLectures: {
    $reduce: {
      // Input là mảng 'courseData' (mảng các sections)
      input: { $ifNull: ["$courseData", []] },
      initialValue: 0,
      in: {
        // '$$value' là tổng số lecture đã đếm
        // '$$this' là section hiện tại
        $add: [
          "$$value",
          // Đếm số lượng phần tử trong mảng 'sectionContents' (mảng các lectures)
          { $size: { $ifNull: ["$$this.sectionContents", []] } },
        ],
      },
    },
  },

  // TÍNH TOÁN LẠI DỰA TRÊN MODEL MỚI
  totalDuration: {
    $reduce: {
      // Input là mảng 'courseData' (mảng các sections)
      input: { $ifNull: ["$courseData", []] },
      initialValue: 0,
      in: {
        // '$$value' là tổng thời lượng đã tính
        // '$$this' là section hiện tại
        $add: [
          "$$value",
          // Tính tổng của tất cả 'videoLength' trong mảng 'sectionContents'
          { $sum: { $ifNull: ["$$this.sectionContents.videoLength", []] } },
        ],
      },
    },
  },
};

/**
 * 3. Định nghĩa kiểu trả về phân trang
 */
export interface IPaginatedTutorCourseResult {
  data: ICourseCardDto[];
  pagination: {
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}
