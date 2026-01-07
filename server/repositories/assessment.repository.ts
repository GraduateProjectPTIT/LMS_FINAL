import mongoose, { Types } from "mongoose";
import EnrolledCourseModel, { IEnrolledCourse } from "../models/enrolledCourse.model";
import CourseModel from "../models/course.model";

const findByUserAndCourse = async (
  userId: string | Types.ObjectId,
  courseId: string | Types.ObjectId
): Promise<IEnrolledCourse | null> => {
  return EnrolledCourseModel.findOne({ userId, courseId }).exec();
};

const findById = async (
  enrolledCourseId: string | Types.ObjectId
): Promise<IEnrolledCourse | null> => {
    return EnrolledCourseModel.findById(enrolledCourseId).exec();
};

const updateAssessment = async (
  userId: string,
  courseId: string,
  assessmentData: Partial<NonNullable<IEnrolledCourse["assessment"]>>
) => {
  return EnrolledCourseModel.findOneAndUpdate(
    { userId, courseId },
    {
      $set: {
        "assessment": assessmentData
      }
    },
    { new: true }
  ).exec();
};

const getAssessmentsByFilter = async (filter: any) => {
  return EnrolledCourseModel.find(filter)
    .populate("userId", "name email")
    .populate("courseId", "name")
    .sort({ updatedAt: -1 })
    .exec();
};

const getEnrolledCourseForCertificate = async (userId: string, courseId: string) => {
  return EnrolledCourseModel.findOne({
    userId,
    courseId,
  })
    .populate("userId", "name")
    .populate({
      path: "courseId",
      select: "name creatorId",
      populate: {
        path: "creatorId",
        select: "name",
      },
    })
    .exec();
};

const findCourseIdsByCreator = async (creatorId: string) => {
    const courses = await CourseModel.find({ creatorId }, { _id: 1 });
    return courses.map((c: any) => c._id);
}

export const assessmentRepository = {
  findByUserAndCourse,
  findById,
  updateAssessment,
  getAssessmentsByFilter,
  getEnrolledCourseForCertificate,
  findCourseIdsByCreator
};
