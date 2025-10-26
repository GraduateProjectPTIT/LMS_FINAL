import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMinOrder extends Document {
  userId: string;
  courseId?: string;
}

const minOrderSchema = new Schema<IMinOrder>(
  {
    userId: { type: String, required: true, index: true },

    courseId: { type: String, index: true },
  },
  { timestamps: true }
);
