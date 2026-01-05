import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import {
  getTutorDetailsService,
  updateTutorExpertiseService,
  getTutorDashboardSummaryService,
  getTutorEarningsChartService,
  findCoursesByTutorId,
} from "../services/tutor.service";
import { PaginationParams } from "../utils/pagination.helper";

export const setupTutorProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id.toString();
    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }
    const { expertise } = req.body;
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

    if (!tutorDetails) {
      return next(
        new ErrorHandler("Tutor not found or user is not a tutor", 404)
      );
    }

    res.status(200).json({
      success: true,
      tutorDetails,
    });
  }
);

export const getCoursesByTutor = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tutorId } = req.params;
    const query: PaginationParams = req.query;

    const serviceResult = await findCoursesByTutorId(tutorId, query);

    res.status(200).json({
      success: true,
      ...serviceResult,
    });
  }
);
