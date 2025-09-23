import express from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const categoryRouter = express.Router();

categoryRouter.post("/category/create_category", isAuthenticated, authorizeRoles("admin"), createCategory);

categoryRouter.get("/category/get_all_categories", getAllCategories);

categoryRouter.put(
  "/category/update_category/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateCategory
);

categoryRouter.delete(
  "/category/delete_category/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCategory
);

export default categoryRouter;
