import express from "express"
import { authorizeRoles, isAuthenticated } from "../middleware/auth"
import { createLayout, getLayoutByType, updateLayout } from "../controllers/layout.controller"

const layoutRouter = express.Router()

layoutRouter.post("/layout/create_layout", isAuthenticated, authorizeRoles("admin"), createLayout);
layoutRouter.put("/layout/update_layout", isAuthenticated, authorizeRoles("admin"), updateLayout);
layoutRouter.get("/layout/get_layout/:type", getLayoutByType);

export default layoutRouter
