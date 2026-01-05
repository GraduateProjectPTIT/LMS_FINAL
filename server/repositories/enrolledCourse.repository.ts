import mongoose, { Types } from "mongoose";
import enrolledCourseModel, {
  IEnrolledCourse,
} from "../models/enrolledCourse.model";

const findByUserAndCourse = async (
  userId: Types.ObjectId,
  courseId: Types.ObjectId
): Promise<IEnrolledCourse | null> => {
  return enrolledCourseModel.findOne({ userId, courseId }).exec();
};

const create = async (
  userId: Types.ObjectId,
  courseId: Types.ObjectId
): Promise<IEnrolledCourse> => {
  const newEnrollment = new enrolledCourseModel({
    userId,
    courseId,
  });
  return newEnrollment.save();
};

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
