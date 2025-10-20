import mongoose, { Types } from "mongoose";
import enrolledCourseModel, {
  IEnrolledCourse,
} from "../models/enrolledCourse.model"; // Tùy đường dẫn của bạn

/**
 * Tìm một bản ghi ghi danh theo userId và courseId
 */
const findByUserAndCourse = async (
  userId: Types.ObjectId,
  courseId: Types.ObjectId
): Promise<IEnrolledCourse | null> => {
  return enrolledCourseModel.findOne({ userId, courseId }).exec();
};

/**
 * Tạo một bản ghi ghi danh mới
 */
const create = async (
  userId: Types.ObjectId,
  courseId: Types.ObjectId
): Promise<IEnrolledCourse> => {
  const newEnrollment = new enrolledCourseModel({
    userId,
    courseId,
    // Các trường khác sẽ dùng giá trị default (progress: 0, completed: false, ...)
  });
  return newEnrollment.save();
};

// Hàm đếm từ lần trước (vẫn hữu ích)
const countEnrolledCoursesByStudent = async (
  studentId: Types.ObjectId
): Promise<number> => {
  return enrolledCourseModel.countDocuments({ userId: studentId });
};

export const enrolledCourseRepository = {
  findByUserAndCourse,
  create,
  countEnrolledCoursesByStudent,
};
