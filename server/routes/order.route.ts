import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAdminOrders, getUserOrders } from "../controllers/order.controller";

const orderRouter = express.Router();

orderRouter.post("/order/create_order", isAuthenticated, createOrder);
orderRouter.get("/order/get_all_orders", isAuthenticated, authorizeRoles("admin"), getAdminOrders);
orderRouter.get("/order/get_user_orders", isAuthenticated, getUserOrders);

export default orderRouter;