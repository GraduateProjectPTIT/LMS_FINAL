require("dotenv").config();
import mongoose, { Document, Model, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export enum UserRole {
  Student = "student",
  Tutor = "tutor",
  Admin = "admin",
}
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: UserRole;
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  resetToken?: string;
  activationCode?: string;
  activationToken?: string;
  isVerified: boolean;
  comparePassword: (password: string) => Promise<boolean>;
}

export interface ITutor extends IUser {
  bio: string;
  expertise: string[];
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter your email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.Student,
    },
    socials: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      tiktok: { type: String, default: "" },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      select: false,
    },
    activationCode: {
      type: String,
      select: false,
    },
    activationToken: {
      type: String,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "role", // Quan trọng: key để phân biệt các model
  }
);

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 259200,
    partialFilterExpression: { isVerified: false },
  }
);

// Compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);

const tutorSchema: Schema<ITutor> = new Schema({
  bio: {
    type: String,
    default: "",
    maxlength: [1000, "Bio cannot be more than 1000 characters"],
  },
  expertise: {
    type: [String],
    default: [],
  },
});

// MODEL TUTOR (TẠO TỪ DISCRIMINATOR)
export const tutorModel = userModel.discriminator<ITutor>(
  UserRole.Tutor,
  tutorSchema
);

export default userModel;
