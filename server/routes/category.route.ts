import express from "express";
import {
  createCategory,
  getAllCategories,
} from "../controllers/category.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const categoryRouter = express.Router();

categoryRouter.post("/category/create_category", isAuthenticated, authorizeRoles("admin"), createCategory);

categoryRouter.get("/category/get_all_categories", getAllCategories);

export default categoryRouter;
