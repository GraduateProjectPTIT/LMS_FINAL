import CategoryModel, { ICategory } from "../models/category.model";
import CourseModel from "../models/course.model";

// --- QUERY METHODS ---

const findAll = async (): Promise<ICategory[]> => {
  return CategoryModel.find();
};

const findByTitle = async (title: string) => {
  return CategoryModel.findOne({ title });
};

const findById = async (id: string) => {
  return CategoryModel.findById(id);
};

/**
 * Kiểm tra xem category có đang được sử dụng trong Course nào không
 * (Cross-domain query)
 */
const countCoursesUsingCategory = async (categoryId: string) => {
  return CourseModel.countDocuments({ categories: categoryId });
};

// --- MUTATION METHODS ---

const create = async (title: string) => {
  return CategoryModel.create({ title });
};

const update = async (id: string, title: string) => {
  return CategoryModel.findByIdAndUpdate(
    id,
    { $set: { title } },
    { new: true }
  );
};

const deleteCategory = async (id: string) => {
  return CategoryModel.findByIdAndDelete(id);
};

export const categoryRepository = {
  findAll,
  findByTitle,
  findById,
  countCoursesUsingCategory,
  create,
  update,
  deleteCategory,
};
