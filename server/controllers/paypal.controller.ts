import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import paypalService from "../services/paypal.service";

export const createPayPalCheckoutSession = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, courseIds } = req.body as {
        courseId?: string;
        courseIds?: string[];
      };
      const userId = req.user?._id;

      if (!courseId && (!Array.isArray(courseIds) || courseIds.length === 0)) {
        return next(new ErrorHandler("Course ID(s) is required", 400));
      }
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const idsToProcess = courseId ? [courseId] : (courseIds as string[]);

      const result = await paypalService.createCheckoutSession(
        userId.toString(),
        idsToProcess
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  }
);

export const paypalSuccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, courseIds, token } = req.body as {
        courseId?: string;
        courseIds?: string[];
        token: string;
      };
      const userId = req.user?._id;

      if (
        (!courseId && (!Array.isArray(courseIds) || courseIds.length === 0)) ||
        !token
      ) {
        return next(
          new ErrorHandler("Missing courseId(s) or PayPal token", 400)
        );
      }
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const idsToProcess = courseId ? [courseId] : (courseIds as string[]);

      const result = await paypalService.processPaymentSuccess(
        userId.toString(),
        token,
        idsToProcess
      );

      res.status(200).json(result);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  }
);

export const checkPayPalOrderStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return next(new ErrorHandler("Order ID is required", 400));
      }

      const result = await paypalService.checkPayPalOrderStatus(orderId);

      res.status(200).json({
        success: true,
        order: result,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  }
);

export const checkPayPalPaymentStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;
      if (!paymentId) {
        return next(new ErrorHandler("Payment ID is required", 400));
      }

      const result = await paypalService.checkPaymentStatusFromDB(paymentId);

      res.status(200).json({
        success: true,
        order: result,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  }
);

export const cancelPayPalPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.query;
      res.status(200).json({
        success: true,
        message: "Payment cancelled successfully",
        courseId: courseId,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
