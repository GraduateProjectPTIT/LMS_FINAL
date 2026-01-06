import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEnrolledCourse extends Document {
  userId: mongoose.Types.ObjectId; 
  courseId: mongoose.Types.ObjectId; 
  progress?: number;
  completed?: boolean;
  enrolledAt?: Date;
  completedLectures: mongoose.Types.ObjectId[];
  assessment?: {
    status: "pending" | "submitted" | "graded";
    submissionImage?: {
        public_id: string;
        url: string;
    };
    score?: number;
    feedback?: string;
    passed?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
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
    completedLectures: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    assessment: {
      status: {
        type: String,
        enum: ["pending", "submitted", "graded"],
        default: "pending",
      },
      submissionImage: {
          public_id: { type: String },
          url: { type: String }
      },
      score: { type: Number },
      feedback: { type: String },
      passed: { type: Boolean, default: false },
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
