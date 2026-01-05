import { adminModel } from "../models/admin.model";

const findByUserId = async (userId: string) => {
  return adminModel.findOne({ userId });
};

const findById = async (id: string) => {
  return adminModel.findById(id);
};

const create = async (data: any) => {
  return adminModel.create(data);
};

const update = async (id: string, data: any) => {
  return adminModel.findByIdAndUpdate(id, { $set: data }, { new: true });
};

const deleteAdmin = async (id: string) => {
  return adminModel.findByIdAndDelete(id);
};

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
