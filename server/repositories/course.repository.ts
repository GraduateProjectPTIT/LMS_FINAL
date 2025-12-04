import mongoose, { Types } from "mongoose";
// Import thêm ICourse và userModel
import courseModel, { ICourse } from "../models/course.model";
import userModel from "../models/user.model";
import { studentModel } from "../models/student.model";
import CourseSimilarityModel from "../scripts/models/courseSimilarity.model";
import {
  courseListProjection,
  ICourseCardDto,
} from "../interfaces/course-tutor-view.interface";
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
export const getColdStartRecommendations = async (
  userId: mongoose.Types.ObjectId,
  limit: number
): Promise<ICourseCardDto[]> => {
  // <<< THAY ĐỔI: Kiểu trả về

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
    // --- THAY ĐỔI: Dùng aggregate ---
    // Nếu không có thể loại, lấy các khóa học mua nhiều nhất
    return courseModel.aggregate([
      // Sắp xếp trước
      { $sort: { purchased: -1 } },
      // Giới hạn số lượng
      { $limit: limit },
      // Định dạng lại đầu ra
      { $project: courseListProjection },
    ]);
  }

  // --- THAY ĐỔI: Dùng aggregate ---
  // Lấy các khóa học phổ biến nhất trong thể loại yêu thích (interests)
  return courseModel.aggregate([
    // Lọc trước (nhanh hơn)
    { $match: { categories: { $in: favoriteCategories } } },
    // Sắp xếp
    { $sort: { purchased: -1 } },
    // Giới hạn
    { $limit: limit },
    // Định dạng lại đầu ra
    { $project: courseListProjection },
  ]);
};

const getPrecomputedRecommendations = async (
  userPurchasedCourses: mongoose.Types.ObjectId[],
  limit: number
): Promise<any[]> => {
  // Bạn nên đổi any[] thành ICourseCardDto[] cho đồng bộ

  return CourseSimilarityModel.aggregate([
    // 1. Chỉ tìm các khóa học mà user ĐÃ MUA
    {
      $match: {
        _id: { $in: userPurchasedCourses },
      },
    },
    // 2. "Xé" mảng gợi ý của chúng ra
    {
      $unwind: "$recommendations",
    },
    // 3. Lọc ra các khóa học user ĐÃ CÓ (tránh gợi ý lại cái đã mua)
    {
      $match: {
        "recommendations.courseId": { $nin: userPurchasedCourses },
      },
    },
    // 4. Gom nhóm lại và CỘNG ĐIỂM
    {
      $group: {
        _id: "$recommendations.courseId",
        totalScore: { $sum: "$recommendations.score" },
      },
    },
    // 5. Sắp xếp theo điểm cao nhất
    {
      $sort: { totalScore: -1 },
    },
    // 6. Giới hạn số lượng
    {
      $limit: limit,
    },
    // 7. Lookup lấy thông tin chi tiết (lúc này data đang nằm trong field courseDetails)
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "courseDetails",
      },
    },
    {
      $unwind: "$courseDetails",
    },

    // 🔥 BƯỚC QUAN TRỌNG NHẤT: Bóc tách dữ liệu 🔥
    {
      $replaceRoot: {
        newRoot: {
          // Trộn thông tin khóa học với điểm số (nếu muốn giữ lại điểm để debug)
          $mergeObjects: [
            "$courseDetails",
            { recommendationScore: "$totalScore" },
          ],
        },
      },
    },

    // 8. Cuối cùng: Áp dụng projection Y HỆT như hàm Cold Start
    // Đảm bảo biến courseListProjection được import vào đây
    {
      $project: courseListProjection,
    },
  ]);
};

export const courseRepository = {
  getTutorStatistics,
  findSimpleById,
  getColdStartRecommendations, // Giữ nguyên tên export
  getPrecomputedRecommendations, // <--- Thêm hàm mới vào export
};
