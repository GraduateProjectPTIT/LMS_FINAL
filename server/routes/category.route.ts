// routes/category.route.ts
import express from "express";
import {
  createCategory,
  getAllCategories,
} from "../controllers/category.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth"; // Ví dụ về bảo mật

const categoryRouter = express.Router();

// Chỉ admin mới được tạo category mới
categoryRouter.post("/category/create_category", createCategory);

// Bất kỳ ai cũng có thể xem categories
categoryRouter.get("/category/get_all_categories", getAllCategories);

export default categoryRouter;
