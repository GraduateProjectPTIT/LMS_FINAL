import { Request, Response, NextFunction } from "express";
import {
  addToCartService,
  removeFromCartService,
  moveToSavedForLaterService,
  moveToCartFromSavedService,
  clearCartService,
  getCartService,
} from "../services/cart.service";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

export const getCart = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?._id;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  const data = await getCartService(String(userId), next);
  res.status(200).json({ success: true, cart: data });
});

export const addToCart = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?._id;
  const { courseId } = req.params as any;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  const { cart, added } = await addToCartService(String(userId), String(courseId));
  const data = await getCartService(String(userId), next);
  res.status(added ? 200 : 400).json({
    success: added,
    message: added ? "Added course to cart" : "Course is already in the cart",
    ...(added && { cart: data }),
  });
});

export const removeFromCart = CatchAsyncError(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?._id;
  const { courseId } = req.params as any;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  await removeFromCartService(String(userId), String(courseId));
  const data = await getCartService(String(userId), next);
  res.status(200).json({ success: true, cart: data });
});

export const moveToSavedForLater = CatchAsyncError(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?._id;
  const { courseId } = req.params as any;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  await moveToSavedForLaterService(String(userId), String(courseId));
  const data = await getCartService(String(userId), next);
  res.status(200).json({ success: true, cart: data });
});

export const moveToCartFromSaved = CatchAsyncError(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?._id;
  const { courseId } = req.params as any;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  await moveToCartFromSavedService(String(userId), String(courseId));
  const data = await getCartService(String(userId), next);
  res.status(200).json({ success: true, cart: data });
});

export const clearCart = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?._id;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  await clearCartService(String(userId));
  const data = await getCartService(String(userId), next);
  res.status(200).json({ success: true, cart: data });
});
