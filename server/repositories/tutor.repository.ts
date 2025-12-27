import { tutorModel } from "../models/tutor.model";
import { FilterQuery } from "mongoose";

// --- QUERY METHODS ---

/**
 * Tìm hồ sơ Tutor dựa trên User ID (Liên kết 1-1 với User)
 */
const findByUserId = async (userId: string) => {
  return tutorModel.findOne({ userId }).populate("userId", "name email avatar");
};

/**
 * Tìm Tutor bằng ID hồ sơ (Profile ID)
 */
const findById = async (id: string) => {
  return tutorModel.findById(id).populate("userId", "name email avatar");
};

/**
 * Lấy danh sách Tutor (có phân trang và filter)
 * Thường dùng cho trang "Danh sách giảng viên"
 */
const findAll = async (
  filter: FilterQuery<any> = {},
  skip: number = 0,
  limit: number = 10
) => {
  return tutorModel
    .find(filter)
    .populate("userId", "name email avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countDocuments = async (filter: FilterQuery<any> = {}) => {
  return tutorModel.countDocuments(filter);
};

// --- MUTATION METHODS ---

const create = async (data: any) => {
  return tutorModel.create(data);
};

/**
 * Cập nhật thông tin Tutor (Kinh nghiệm, chuyên môn...)
 */
const update = async (id: string, data: any) => {
  return tutorModel.findByIdAndUpdate(id, { $set: data }, { new: true });
};

/**
 * Xóa hồ sơ Tutor
 */
const deleteTutor = async (id: string) => {
  return tutorModel.findByIdAndDelete(id);
};

/**
 * Xóa hồ sơ Tutor dựa trên User ID (Dùng khi xóa User chính)
 */
const deleteByUserId = async (userId: string) => {
  return tutorModel.findOneAndDelete({ userId });
};

export const tutorRepository = {
  findByUserId,
  findById,
  findAll,
  countDocuments,
  create,
  update,
  deleteTutor,
  deleteByUserId,
};
