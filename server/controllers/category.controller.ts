// controllers/category.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  createCategoryService,
  getAllCategoriesService,
} from "../services/category.service";

// Controller để tạo category
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

// Controller để lấy tất cả categories
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
