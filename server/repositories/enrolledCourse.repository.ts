import { Types } from "mongoose";
import enrolledCourseModel from "../models/enrolledCourse.model";

/**
 * Đếm tổng số khóa học mà một student đã đăng ký.
 */
const countEnrolledCoursesByStudent = async (
  studentId: Types.ObjectId
): Promise<number> => {
  // Dùng userId thay vì studentId cho đúng schema của bạn
  return enrolledCourseModel.countDocuments({ userId: studentId });
};

export const enrolledCourseRepository = {
  countEnrolledCoursesByStudent,
};
