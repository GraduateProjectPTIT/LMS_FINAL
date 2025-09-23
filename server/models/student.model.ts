import mongoose, { Model, Schema } from "mongoose";
import { IStudent } from "../types/user.types";

const studentSchema: Schema<IStudent> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    interests: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      default: [],
    },
  },
  { timestamps: true }
);

export const studentModel: Model<IStudent> = mongoose.model<IStudent>(
  "Student",
  studentSchema
);
