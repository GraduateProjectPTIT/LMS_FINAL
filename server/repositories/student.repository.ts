import { Types } from "mongoose";
import { studentModel } from "../models/student.model";
import CategoryModel from "../models/category.model";
import { IStudent } from "../types/user.types";

const findByUserId = async (userId: string) => {
  return studentModel.findOne({ userId });
};

const countValidCategories = async (ids: string[]) => {
  return CategoryModel.countDocuments({
    _id: { $in: ids },
  });
};

const updateInterests = async (
  studentProfile: any,
  interests: Types.ObjectId[]
) => {
  studentProfile.interests = interests;
  await studentProfile.save();

  return studentProfile.populate("interests");
};

export const studentRepository = {
  findByUserId,
  countValidCategories,
  updateInterests,
};
