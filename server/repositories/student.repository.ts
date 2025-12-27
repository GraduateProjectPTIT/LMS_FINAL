import { Types } from "mongoose";
import { studentModel } from "../models/student.model";
import CategoryModel from "../models/category.model";
import { IStudent } from "../types/user.types";

/**
 * Tìm hồ sơ Student dựa trên User ID
 */
const findByUserId = async (userId: string) => {
  return studentModel.findOne({ userId });
};

/**
 * Đếm số lượng danh mục hợp lệ dựa trên danh sách ID đầu vào
 * (Dùng để validate xem các ID sở thích gửi lên có tồn tại trong DB không)
 */
const countValidCategories = async (ids: string[]) => {
  return CategoryModel.countDocuments({
    _id: { $in: ids },
  });
};

/**
 * Cập nhật danh sách sở thích và trả về dữ liệu đã được populate
 */
const updateInterests = async (
  studentProfile: any, // Document Student
  interests: Types.ObjectId[]
) => {
  studentProfile.interests = interests;
  await studentProfile.save();

  // Populate field interests để lấy title trả về cho Frontend
  return studentProfile.populate("interests");
};

export const studentRepository = {
  findByUserId,
  countValidCategories,
  updateInterests,
};
