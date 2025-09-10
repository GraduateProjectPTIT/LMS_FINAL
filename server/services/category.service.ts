import CategoryModel, { ICategory } from "../models/category.model";

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
