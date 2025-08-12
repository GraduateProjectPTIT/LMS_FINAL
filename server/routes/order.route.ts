import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAdminOrders, getUserOrders, getPaidOrders } from "../controllers/order.controller";

const orderRouter = express.Router();

orderRouter.post("/order/create_order", isAuthenticated, createOrder);
orderRouter.get("/order/get_all_orders", isAuthenticated, authorizeRoles("admin"), getAdminOrders);
orderRouter.get("/order/get_user_orders", isAuthenticated, getUserOrders);
orderRouter.get("/order/get_paid_orders", isAuthenticated, authorizeRoles("admin"), getPaidOrders);

export default orderRouter;