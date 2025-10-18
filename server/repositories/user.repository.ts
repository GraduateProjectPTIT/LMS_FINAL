import mongoose, { Types } from "mongoose";
import userModel, { IUser } from "../models/user.model";
import { IStudent } from "../types/user.types";

const findUserDetailById = async (
  userId: string | Types.ObjectId
): Promise<IUser | null> => {
  return userModel
    .findById(userId)
    .select("-password -resetToken -activationCode -activationToken")
    .exec();
};

// Export thành một đối tượng để dễ dàng import
export const userRepository = {
  findUserDetailById,
};
