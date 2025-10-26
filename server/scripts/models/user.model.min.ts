import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMinUser extends Document {
  name: string;
}

const minUserSchema = new Schema<IMinUser>(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);
