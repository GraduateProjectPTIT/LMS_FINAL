// services/category.service.ts
import CategoryModel, { ICategory } from "../models/category.model";

// Service để tạo category mới
export const createCategoryService = async (
  title: string
): Promise<ICategory> => {
  const isCategoryExist = await CategoryModel.findOne({ title });

  const category = await CategoryModel.create({ title });
  return category;
};

// Service để lấy tất cả categories
export const getAllCategoriesService = async (): Promise<ICategory[]> => {
  const categories = await CategoryModel.find().sort({ createdAt: -1 });
  return categories;
};

// ... các service khác cho update, delete ...
