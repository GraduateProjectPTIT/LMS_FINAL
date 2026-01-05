import mongoose, { FilterQuery, SortOrder } from "mongoose";
import PostModel, { IPost } from "../models/post.model"; // Import IPost
import CategoryModel from "../models/category.model";

const findById = async (id: string) => {
  return PostModel.findById(id).populate("authorId", "name avatar").exec();
};

const findBySlug = async (slug: string) => {
  return PostModel.findOne({ slug }).populate("authorId", "name avatar").exec();
};

const findBySlugAndIncrementViews = async (slug: string) => {
  return PostModel.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("authorId", "name avatar")
    .exec();
};

const countDocuments = async (filter: FilterQuery<any>) => {
  return PostModel.countDocuments(filter).exec();
};

const getDistinctTags = async () => {
  return PostModel.distinct("tags", { status: "published" }).exec();
};

const create = async (data: any) => {
  return PostModel.create(data);
};

const save = async (doc: any) => {
  return doc.save();
};

const deletePost = async (id: string) => {
  return PostModel.deleteOne({ _id: id }).exec();
};

const findCategoriesByIds = async (ids: string[]) => {
  return CategoryModel.find({ _id: { $in: ids } })
    .select("title")
    .exec();
};

export const postRepository = {
  findById,
  findBySlug,
  findBySlugAndIncrementViews,
  countDocuments,
  getDistinctTags,
  create,
  save,
  deletePost,
  findCategoriesByIds,
};
