import express from "express";
import { isAuthenticated } from "../middleware/auth";
import { createPayPalCheckoutSession, paypalSuccess, checkPayPalPaymentStatus, cancelPayPalPayment, checkPayPalOrderStatus } from "../controllers/order.controller";

const paypalRouter = express.Router();

paypalRouter.post("/create-checkout-session", isAuthenticated, createPayPalCheckoutSession);
paypalRouter.post("/success", isAuthenticated, paypalSuccess);
paypalRouter.get("/cancel", isAuthenticated, cancelPayPalPayment);
paypalRouter.get("/order-status/:orderId", isAuthenticated, checkPayPalOrderStatus);
paypalRouter.get("/payment-status/:paymentId", isAuthenticated, checkPayPalPaymentStatus);

export default paypalRouter;
