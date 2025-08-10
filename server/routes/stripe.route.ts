import express from "express";
import { isAuthenticated } from "../middleware/auth";
import { createStripeCheckoutSession } from "../controllers/order.controller";

const stripeRouter = express.Router();

stripeRouter.post("/create-checkout-session", isAuthenticated, createStripeCheckoutSession);

export default stripeRouter;
