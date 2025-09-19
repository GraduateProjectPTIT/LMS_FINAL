import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  addToCart,
  removeFromCart,
  moveToSavedForLater,
  moveToCartFromSaved,
  clearCart,
  getCart,
} from "../controllers/cart.controller";

const cartRouter = express.Router();

cartRouter.get("/cart", isAuthenticated, getCart);
cartRouter.post("/cart/add/:courseId", isAuthenticated, addToCart);
cartRouter.delete("/cart/remove/:courseId", isAuthenticated, removeFromCart);
cartRouter.post("/cart/move-to-saved/:courseId", isAuthenticated, moveToSavedForLater);
cartRouter.post("/cart/move-to-cart/:courseId", isAuthenticated, moveToCartFromSaved);
cartRouter.delete("/cart/clear", isAuthenticated, clearCart);

export default cartRouter;
