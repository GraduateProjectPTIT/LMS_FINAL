// src/models/courseSimilarity.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";

// Định nghĩa cấu trúc (dù Python mới là người ghi)
export interface ICourseSimilarity extends Document {
  _id: mongoose.Types.ObjectId; // ID của khóa học gốc
  recommendations: {
    courseId: mongoose.Types.ObjectId;
    score: number;
  }[];
}

// Khai báo schema "lỏng"
// Chúng ta định nghĩa các trường để code dễ đọc,
// nhưng 'strict: false' cho phép sự linh hoạt
const courseSimilaritySchema = new Schema<ICourseSimilarity>(
  {
    _id: { type: Schema.Types.ObjectId },
    recommendations: [
      {
        courseId: { type: Schema.Types.ObjectId, ref: "Course" },
        score: { type: Number },
      },
    ],
  },
  {
    strict: false, // Rất quan trọng
    collection: "course_similarities", // Chỉ định rõ tên collection
  }
);

const CourseSimilarityModel: Model<ICourseSimilarity> =
  mongoose.model<ICourseSimilarity>(
    "CourseSimilarity", // Tên model trong Mongoose
    courseSimilaritySchema
  );

export default CourseSimilarityModel;
