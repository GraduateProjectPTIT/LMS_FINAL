import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import {
  getTutorDetailsService,
  updateTutorExpertiseService,
  getTutorDashboardSummaryService,
  getTutorEarningsChartService,
} from "../services/tutor.service";

// register setup profile cho tutor
export const setupTutorProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id.toString();
    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }
    const { expertise } = req.body;

    // 3. Gọi service với tên mới
    const updatedTutorProfile = await updateTutorExpertiseService(userId, {
      expertise,
    });

    res.status(200).json({
      success: true,
      message: "Tutor profile setup completed successfully.",
      tutor: updatedTutorProfile,
    });
  }
);

export const getTutorDashboardSummary = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new ErrorHandler("Authentication required", 401);
    const data = await getTutorDashboardSummaryService(userId);
    res.status(200).json({ success: true, ...data });
  }
);

export const getTutorEarnings = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new ErrorHandler("Authentication required", 401);
    const range = String(req.query?.range || "30d");
    const data = await getTutorEarningsChartService(userId, range);
    res.status(200).json({ success: true, ...data });
  }
);

export const getTutorOverview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const tutorId = req.params.id;
    const tutorDetails = await getTutorDetailsService(tutorId);

    res.status(200).json({
      success: true,
      tutorDetails,
    });
  }
);
