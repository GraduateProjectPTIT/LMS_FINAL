import mongoose from "mongoose";
import EnrolledCourseModel from "../models/enrolledCourse.model";

export function countTotalLectures(courseDoc: any): number {
  const sections = (courseDoc?.courseData || []) as any[];
  return sections.reduce(
    (acc: number, sec: any) =>
      acc + (Array.isArray(sec?.sectionContents) ? sec.sectionContents.length : 0),
    0
  );
}

export async function recomputeEnrollmentsProgressForCourse(
  courseId: mongoose.Types.ObjectId | string,
  totalLectures: number
) {
  if (!totalLectures || totalLectures <= 0) return;
  const courseObjectId = new mongoose.Types.ObjectId(String(courseId));
  const enrollments = await EnrolledCourseModel.find({ courseId: courseObjectId }).select(
    "_id completedLectures progress completed"
  );
  for (const en of enrollments) {
    const completedCount = (en.completedLectures || []).length;
    const progress = Math.min(100, Math.round((completedCount / totalLectures) * 100));
    const completed = progress >= 100;
    if (progress !== (en.progress ?? 0) || completed !== (en.completed ?? false)) {
      en.progress = progress;
      en.completed = completed;
      await en.save();
    }
  }
}
