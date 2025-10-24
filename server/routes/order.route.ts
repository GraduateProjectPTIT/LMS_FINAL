import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAdminOrders, getUserOrders, getPaidOrders, getAdminOrderDetail, getTutorOrders, getTutorOrderDetail } from "../controllers/order.controller";

const orderRouter = express.Router();

orderRouter.post("/order/create_order", isAuthenticated, createOrder);
orderRouter.get("/order/get_all_orders", isAuthenticated, authorizeRoles("admin"), getAdminOrders);
orderRouter.get("/order/get_user_orders", isAuthenticated, getUserOrders);
orderRouter.get("/order/get_paid_orders", isAuthenticated, authorizeRoles("admin"), getPaidOrders);
orderRouter.get("/order/get_order_detail/:id", isAuthenticated, authorizeRoles("admin"), getAdminOrderDetail);
orderRouter.get("/order/tutor/get_orders", isAuthenticated, authorizeRoles("tutor"), getTutorOrders);
orderRouter.get("/order/tutor/get_order_detail/:id", isAuthenticated, authorizeRoles("tutor"), getTutorOrderDetail);

export default orderRouter;