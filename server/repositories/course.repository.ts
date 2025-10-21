import mongoose, { Types } from "mongoose";
// Import thêm ICourse và userModel
import courseModel, { ICourse } from "../models/course.model";
import userModel from "../models/user.model";
import { studentModel } from "../models/student.model";
// Import studentModel để lấy interests

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

  if (stats.length > 0) {
    return stats[0];
  }

  return {
    totalStudents: 0,
    totalCourses: 0,
    totalReviews: 0,
    averageRating: 0,
  };
};

const findSimpleById = async (id: Types.ObjectId) =>
  courseModel.findById(id).select("_id").lean();

// --- HÀM ĐÃ SỬA ---
/**
 * Lấy các khóa học cold-start dựa trên thể loại yêu thích (interests)
 * từ studentProfile của người dùng.
 */
const getColdStartRecommendations = async (
  userId: mongoose.Types.ObjectId,
  limit: number
): Promise<ICourse[]> => {
  // 1. Tìm User để lấy studentProfile ID
  const user = await userModel.findById(userId).select("studentProfile").lean();

  let favoriteCategories: mongoose.Types.ObjectId[] = [];

  // 2. Nếu user có studentProfile, tìm student's interests
  if (user && user.studentProfile) {
    const studentProfile = await studentModel
      .findById(user.studentProfile)
      .select("interests")
      .lean();

    if (studentProfile && studentProfile.interests) {
      favoriteCategories = studentProfile.interests;
    }
  }

  // 3. Quyết định logic dựa trên việc có interests (favoriteCategories) hay không
  if (favoriteCategories.length === 0) {
    // Nếu không có thể loại, lấy các khóa học mua nhiều nhất
    return courseModel
      .find({})
      .sort({ purchased: -1 })
      .limit(limit)
      .select("name description thumbnail price ratings purchased")
      .lean();
  }

  // Lấy các khóa học phổ biến nhất trong thể loại yêu thích (interests)
  return courseModel
    .find({
      categories: { $in: favoriteCategories },
    })
    .sort({ purchased: -1 })
    .limit(limit)
    .select("name description thumbnail price ratings purchased")
    .lean();
};
// --- KẾT THÚC HÀM SỬA ---

export const courseRepository = {
  getTutorStatistics,
  findSimpleById,
  getColdStartRecommendations, // Giữ nguyên tên export
};
