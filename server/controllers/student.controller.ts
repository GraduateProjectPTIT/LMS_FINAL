// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { updateStudentInterestService } from "../services/student.service";

// register setup profile cho student
export const setupStudentProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id.toString();
    if (!userId) {
      return next(new ErrorHandler("Authentication required", 401));
    }
    const { interests } = req.body;

    // 3. Gọi service với tên mới
    const updatedStudentProfile = await updateStudentInterestService(userId, {
      interests,
    });

    res.status(200).json({
      success: true,
      message: "Student profile setup completed successfully.",
      student: updatedStudentProfile,
    });
  }
);
