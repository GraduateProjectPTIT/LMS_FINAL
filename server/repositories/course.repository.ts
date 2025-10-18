import { Types } from "mongoose";
import courseModel from "../models/course.model";

// Định nghĩa một interface cho kết quả trả về
export interface ITutorStats {
  totalStudents: number;
  totalCourses: number;
  totalReviews: number;
  averageRating: number;
}
const getTutorStatistics = async (
  tutorId: Types.ObjectId
): Promise<ITutorStats> => {
  const stats = await courseModel.aggregate([
    {
      $match: {
        creatorId: tutorId,
      },
    },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: "$purchased" },
        totalCourses: { $sum: 1 },
        totalReviews: { $sum: { $size: "$reviews" } },
        averageRating: { $avg: "$ratings" },
      },
    },
    {
      $project: {
        _id: 0,
        totalStudents: 1,
        totalCourses: 1,
        totalReviews: 1,
        averageRating: { $round: ["$averageRating", 1] },
      },
    },
  ]);

  // Nếu tutor chưa có khóa nào, trả về mảng rỗng
  if (stats.length > 0) {
    return stats[0];
  }

  // Trả về số liệu mặc định nếu không có
  return {
    totalStudents: 0,
    totalCourses: 0,
    totalReviews: 0,
    averageRating: 0,
  };
};

const findSimpleById = async (id: Types.ObjectId) =>
  courseModel.findById(id).select("_id").lean();
// ... (thêm vào export)

export const courseRepository = {
  getTutorStatistics,
  findSimpleById,
};
