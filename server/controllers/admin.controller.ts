import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  adminCreateEnrollmentService,
  getAllUsersService,
  getUserDetailService,
} from "../services/admin.service";
import {
  getAdminDashboardSummaryService,
  getAdminRevenueChartService,
} from "../services/admin.service";

// --- LẤY TẤT CẢ USERS (ADMIN) ---
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Call the service and pass the request query
    const paginatedUsers = await getAllUsersService(req.query);

    // 2. Send the response with the data returned from the service
    res.status(200).json({
      success: true,
      ...paginatedUsers,
    });
  }
);

export const getUserDetail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const userDetail = await getUserDetailService(id);

    res.status(200).json({
      success: true,
      user: userDetail,
    });
  }
);

export const createEnrollment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, courseId } = req.body;

    const newEnrollment = await adminCreateEnrollmentService(userId, courseId);

    res.status(201).json({
      success: true,
      message: "Ghi danh học viên thành công.",
      enrollment: newEnrollment,
    });
  }
);
export const getAdminDashboardSummary = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await getAdminDashboardSummaryService();
    res.status(200).json({ success: true, ...data });
  }
);

export const getAdminRevenue = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const range = String(req.query?.range || "30d");
    const data = await getAdminRevenueChartService(range);
    res.status(200).json({ success: true, ...data });
  }
);
