import mongoose, { Model, Schema } from "mongoose";
import { IAdmin } from "../types/user.types";

const adminSchema: Schema<IAdmin> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const AdminModel: Model<IAdmin> = mongoose.model<IAdmin>(
  "Admin",
  adminSchema
);
