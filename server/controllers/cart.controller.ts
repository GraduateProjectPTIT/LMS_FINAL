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

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return next(new ErrorHandler("Unauthorized", 401));
    const data = await getCartService(String(userId), next);
    res.status(200).json({ success: true, cart: data });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, error.statusCode || 500));
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const { courseId } = req.params as any;
    if (!userId) return next(new ErrorHandler("Unauthorized", 401));
    await addToCartService(String(userId), String(courseId));
    const data = await getCartService(String(userId), next);
    res.status(200).json({ success: true, cart: data });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, error.statusCode || 500));
  }
};

export const removeFromCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?._id;
    const { courseId } = req.params as any;
    if (!userId) return next(new ErrorHandler("Unauthorized", 401));
    await removeFromCartService(String(userId), String(courseId));
    const data = await getCartService(String(userId), next);
    res.status(200).json({ success: true, cart: data });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, error.statusCode || 500));
  }
};

export const moveToSavedForLater = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?._id;
    const { courseId } = req.params as any;
    if (!userId) return next(new ErrorHandler("Unauthorized", 401));
    await moveToSavedForLaterService(String(userId), String(courseId));
    const data = await getCartService(String(userId), next);
    res.status(200).json({ success: true, cart: data });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, error.statusCode || 500));
  }
};

export const moveToCartFromSaved = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?._id;
    const { courseId } = req.params as any;
    if (!userId) return next(new ErrorHandler("Unauthorized", 401));
    await moveToCartFromSavedService(String(userId), String(courseId));
    const data = await getCartService(String(userId), next);
    res.status(200).json({ success: true, cart: data });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, error.statusCode || 500));
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return next(new ErrorHandler("Unauthorized", 401));
    await clearCartService(String(userId));
    const data = await getCartService(String(userId), next);
    res.status(200).json({ success: true, cart: data });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, error.statusCode || 500));
  }
};
