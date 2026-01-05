import mongoose, { Types } from "mongoose";
import userModel, { IUser } from "../models/user.model";
import orderModel, { IOrderItem } from "../models/order.model";
import { studentModel } from "../models/student.model";
import { tutorModel } from "../models/tutor.model";
import { adminModel } from "../models/admin.model";

// --- FIND METHODS ---

const findById = async (id: string | Types.ObjectId) => {
  return userModel.findById(id);
};

const findUserDetailById = async (
  userId: string | Types.ObjectId
): Promise<IUser | null> => {
  return userModel
    .findById(userId)
    .select("-password -resetToken -activationCode -activationToken")
    .exec();
};

const findSimpleById = async (id: Types.ObjectId) =>
  userModel.findById(id).select("_id").lean();

const findUserWithPassword = async (userId: string) => {
  return userModel.findById(userId).select("+password");
};

// --- UPDATE METHODS ---

const updateUserRole = async (userId: string, role: string) => {
  return userModel.findByIdAndUpdate(userId, { role }, { new: true });
};

const updateNotificationSettings = async (
  userId: string,
  updateFields: any
) => {
  return userModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  );
};

// --- DELETE METHODS ---

const deleteUser = async (userId: string) => {
  return userModel.findByIdAndDelete(userId);
};

const deleteRelatedProfile = async (
  role: string,
  profileId: string | Types.ObjectId
) => {
  switch (role) {
    case "student": // UserRole.Student
      return studentModel.findByIdAndDelete(profileId);
    case "tutor": // UserRole.Tutor
      return tutorModel.findByIdAndDelete(profileId);
    case "admin": // UserRole.Admin
      return adminModel.findByIdAndDelete(profileId);
    default:
      return null;
  }
};

const findUserPurchases = async (
  userId: mongoose.Types.ObjectId
): Promise<{ purchasedCourses: mongoose.Types.ObjectId[] } | null> => {
  const userIdString = userId.toString();

  const singleCourseOrders = await orderModel
    .find({
      userId: userIdString,
      courseId: { $exists: true, $ne: null },
    })
    .select("courseId")
    .lean();

  const cartOrders = await orderModel
    .find({
      userId: userIdString,
      items: { $exists: true, $ne: [] },
    })
    .select("items.courseId")
    .lean();

  const purchasedSet = new Set<string>();

  singleCourseOrders.forEach((order) => {
    if (order.courseId) {
      purchasedSet.add(order.courseId.toString());
    }
  });

  cartOrders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: IOrderItem) => {
        if (item.courseId) {
          purchasedSet.add(item.courseId.toString());
        }
      });
    }
  });

  const purchasedCourses = Array.from(purchasedSet).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  return { purchasedCourses };
};

export const userRepository = {
  findById,
  findUserDetailById,
  findSimpleById,
  findUserWithPassword,
  updateUserRole,
  updateNotificationSettings,
  deleteUser,
  deleteRelatedProfile,
  findUserPurchases,
};
