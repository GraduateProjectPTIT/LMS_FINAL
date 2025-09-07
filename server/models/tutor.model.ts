import mongoose, { Model, Schema } from "mongoose";
import { ITutor } from "../types/user.types";

const tutorSchema: Schema<ITutor> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    expertise: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      default: [],
    },
  },
  { timestamps: true }
);

export const tutorModel: Model<ITutor> = mongoose.model<ITutor>(
  "Tutor",
  tutorSchema
);
