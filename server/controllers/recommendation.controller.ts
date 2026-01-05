import { Request, Response, NextFunction } from "express";
import { recommendationService } from "../services/recommendation.service";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";

const getRecommendations = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user._id) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const userId = user._id;

    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;

    if (isNaN(limit) || limit <= 0) {
      return next(new ErrorHandler("Invalid 'limit' parameter", 400));
    }

    const recommendations =
      await recommendationService.getRecommendationsForUser(userId, limit);

    res.status(200).json({
      success: true,
      recommendations,
    });
  }
);

const getTestRecommendations = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    if (!userId) {
      return next(new ErrorHandler("Please provide a userId in the URL", 400));
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;
    if (isNaN(limit) || limit <= 0) {
      return next(new ErrorHandler("Invalid 'limit' parameter", 400));
    }

    const recommendations =
      await recommendationService.getRecommendationsForUser(userId, limit);

    res.status(200).json({
      success: true,
      testingUserId: userId,
      recommendations,
    });
  }
);

export const recommendationController = {
  getRecommendations,
  getTestRecommendations,
};
