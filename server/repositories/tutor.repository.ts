import { tutorModel } from "../models/tutor.model";
import { FilterQuery } from "mongoose";

// --- QUERY METHODS ---

const findByUserId = async (userId: string) => {
  return tutorModel.findOne({ userId }).populate("userId", "name email avatar");
};

const findById = async (id: string) => {
  return tutorModel.findById(id).populate("userId", "name email avatar");
};

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

const create = async (data: any) => {
  return tutorModel.create(data);
};

const update = async (id: string, data: any) => {
  return tutorModel.findByIdAndUpdate(id, { $set: data }, { new: true });
};

const deleteTutor = async (id: string) => {
  return tutorModel.findByIdAndDelete(id);
};

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
