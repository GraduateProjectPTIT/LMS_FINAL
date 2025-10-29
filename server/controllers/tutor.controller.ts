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

    if (!tutorDetails) {
      // Trả về lỗi 404 Not Found
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
    // 1. Lấy các tham số cần thiết từ request
    const { tutorId } = req.params;
    const query: PaginationParams = req.query;

    // 2. Gọi service và truyền các tham số
    // Service sẽ trả về một object (ví dụ: { message, data, pagination })
    const serviceResult = await findCoursesByTutorId(tutorId, query);

    // 3. Gửi response, "trải" kết quả từ service vào
    res.status(200).json({
      success: true,
      ...serviceResult,
    });
  }
);
