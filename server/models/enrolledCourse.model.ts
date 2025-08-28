import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEnrolledCourse extends Document {
  userId: mongoose.Types.ObjectId; 
  courseId: mongoose.Types.ObjectId; 
  progress?: number;
  completed?: boolean;
  enrolledAt?: Date;
}

const enrolledCourseSchema = new Schema<IEnrolledCourse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

enrolledCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const EnrolledCourseModel: Model<IEnrolledCourse> = mongoose.model<IEnrolledCourse>(
  "EnrolledCourse",
  enrolledCourseSchema
);

export default EnrolledCourseModel;
