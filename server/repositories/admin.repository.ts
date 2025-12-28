import { adminModel } from "../models/admin.model";

// --- QUERY METHODS ---

/**
 * Tìm hồ sơ Admin dựa trên User ID
 */
const findByUserId = async (userId: string) => {
  return adminModel.findOne({ userId });
};

const findById = async (id: string) => {
  return adminModel.findById(id);
};

// --- MUTATION METHODS ---

const create = async (data: any) => {
  return adminModel.create(data);
};

/**
 * Cập nhật hồ sơ Admin (Permissions, settings...)
 */
const update = async (id: string, data: any) => {
  return adminModel.findByIdAndUpdate(id, { $set: data }, { new: true });
};

const deleteAdmin = async (id: string) => {
  return adminModel.findByIdAndDelete(id);
};

/**
 * Xóa hồ sơ Admin dựa trên User ID
 */
const deleteByUserId = async (userId: string) => {
  return adminModel.findOneAndDelete({ userId });
};

export const adminRepository = {
  findByUserId,
  findById,
  create,
  update,
  deleteAdmin,
  deleteByUserId,
};
