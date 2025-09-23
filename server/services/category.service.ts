import CategoryModel, { ICategory } from "../models/category.model";
import CourseModel from "../models/course.model";
import ErrorHandler from "../utils/ErrorHandler";

export const createCategoryService = async (
  title: string
): Promise<ICategory> => {
  const isCategoryExist = await CategoryModel.findOne({ title });

  const category = await CategoryModel.create({ title });
  return category;
};

export const getAllCategoriesService = async (): Promise<ICategory[]> => {
  const categories = await CategoryModel.find().sort({ createdAt: -1 });
  return categories;
};

export const updateCategoryService = async (
  id: string,
  title: string
): Promise<ICategory> => {
  const dup = await CategoryModel.findOne({ title });
  if (dup && String(dup._id) !== String(id)) {
    throw new ErrorHandler("Category title already exists", 400);
  }

  const updated = await CategoryModel.findByIdAndUpdate(
    id,
    { $set: { title } },
    { new: true }
  );

  if (!updated) {
    throw new ErrorHandler("Category not found", 404);
  }

  return updated;
};

export const deleteCategoryService = async (id: string): Promise<void> => {
  const usedCount = await CourseModel.countDocuments({ categories: id });
  if (usedCount > 0) {
    throw new ErrorHandler(
      "Cannot delete category that is referenced by existing courses",
      400
    );
  }

  const deleted = await CategoryModel.findByIdAndDelete(id);
  if (!deleted) {
    throw new ErrorHandler("Category not found", 404);
  }
};
