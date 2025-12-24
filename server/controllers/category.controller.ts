import { Request, Response, NextFunction } from "express";
import {
  createCategoryService,
  getAllCategoriesService,
  updateCategoryService,
  deleteCategoryService,
} from "../services/category.service";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title } = req.body;
    const category = await createCategoryService(title);
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getAllCategoriesService();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const updated = await updateCategoryService(id, title);
    res.status(200).json({ success: true, category: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await deleteCategoryService(id);
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    next(error);
  }
};
