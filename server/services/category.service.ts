import { ICategory } from "../models/category.model";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import { categoryRepository } from "../repositories/category.repository";

// --- HELPERS ---
const clearCategoryCache = async () => {
  try {
    await redis.del("categories:all");
  } catch (err) {
    console.error("Redis delete error:", err);
  }
};

// --- SERVICES ---

export const createCategoryService = async (
  title: string
): Promise<ICategory> => {
  // 1. Kiểm tra trùng tên
  const isCategoryExist = await categoryRepository.findByTitle(title);

  if (isCategoryExist) {
    throw new ErrorHandler("Category title already exists", 400);
  }

  // 2. Tạo mới
  const category = await categoryRepository.create(title);

  // 3. Xóa cache
  await clearCategoryCache();

  return category;
};

export const getAllCategoriesService = async (): Promise<ICategory[]> => {
  // 1. Kiểm tra Cache Redis
  try {
    const cached = await redis.get("categories:all");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn("Redis get error:", error);
  }

  // 2. Lấy từ DB nếu không có cache
  const categories = await categoryRepository.findAll();

  // 3. Lưu vào Cache (hết hạn sau 1 giờ)
  try {
    await redis.set("categories:all", JSON.stringify(categories), "EX", 3600);
  } catch {}

  return categories;
};

export const updateCategoryService = async (
  id: string,
  title: string
): Promise<ICategory> => {
  // 1. Kiểm tra trùng tên (nhưng khác ID)
  const dup = await categoryRepository.findByTitle(title);
  if (dup && String(dup._id) !== String(id)) {
    throw new ErrorHandler("Category title already exists", 400);
  }

  // 2. Cập nhật
  const updated = await categoryRepository.update(id, title);

  if (!updated) {
    throw new ErrorHandler("Category not found", 404);
  }

  // 3. Xóa cache
  await clearCategoryCache();

  return updated;
};

export const deleteCategoryService = async (id: string): Promise<void> => {
  const usedCount = await categoryRepository.countCoursesUsingCategory(id);

  if (usedCount > 0) {
    throw new ErrorHandler(
      "Cannot delete category that is referenced by existing courses",
      400
    );
  }

  // 2. Xóa
  const deleted = await categoryRepository.deleteCategory(id);

  if (!deleted) {
    throw new ErrorHandler("Category not found", 404);
  }

  // 3. Xóa cache
  await clearCategoryCache();
};
