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

export const getColdStartRecommendations = async (
  userId: mongoose.Types.ObjectId,
  limit: number
): Promise<ICourseCardDto[]> => {
  const user = await userModel.findById(userId).select("studentProfile").lean();

  let favoriteCategories: mongoose.Types.ObjectId[] = [];

  if (user && user.studentProfile) {
    const studentProfile = await studentModel
      .findById(user.studentProfile)
      .select("interests")
      .lean();

    if (studentProfile && studentProfile.interests) {
      favoriteCategories = studentProfile.interests;
    }
  }

  if (favoriteCategories.length === 0) {
    return courseModel.aggregate([
      { $sort: { purchased: -1 } },
      { $limit: limit },
      { $project: courseListProjection },
    ]);
  }

  // Lấy các khóa học phổ biến nhất trong thể loại yêu thích (interests)
  return courseModel.aggregate([
    { $match: { categories: { $in: favoriteCategories } } },
    { $sort: { purchased: -1 } },
    { $limit: limit },
    { $project: courseListProjection },
  ]);
};

const getPrecomputedRecommendations = async (
  userPurchasedCourses: mongoose.Types.ObjectId[],
  limit: number
): Promise<any[]> => {
  return CourseSimilarityModel.aggregate([
    {
      $match: {
        _id: { $in: userPurchasedCourses },
      },
    },
    {
      $unwind: "$recommendations",
    },
    {
      $match: {
        "recommendations.courseId": { $nin: userPurchasedCourses },
      },
    },
    {
      $group: {
        _id: "$recommendations.courseId",
        totalScore: { $sum: "$recommendations.score" },
      },
    },
    {
      $sort: { totalScore: -1 },
    },
    {
      $limit: limit,
    },
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

    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            "$courseDetails",
            { recommendationScore: "$totalScore" },
          ],
        },
      },
    },

    {
      $project: courseListProjection,
    },
  ]);
};

export const courseRepository = {
  getTutorStatistics,
  findSimpleById,
  getColdStartRecommendations,
  getPrecomputedRecommendations,
};
