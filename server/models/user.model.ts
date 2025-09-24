require("dotenv").config();
import mongoose, { Document, Model, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

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
  bio?: string;
  isVerified: boolean;
  isSurveyCompleted: boolean;
  studentProfile?: Types.ObjectId;
  tutorProfile?: Types.ObjectId;
  adminProfile?: Types.ObjectId;

  comparePassword: (password: string) => Promise<boolean>;
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
    bio: {
      type: String,
      maxLength: [500, "Bio can't be over 500 characters."],
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
    isSurveyCompleted: {
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
      select: false,
    },
    studentProfile: { type: Schema.Types.ObjectId, ref: "Student" },
    tutorProfile: { type: Schema.Types.ObjectId, ref: "Tutor" },
    adminProfile: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  {
    timestamps: true,
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

export default userModel;
