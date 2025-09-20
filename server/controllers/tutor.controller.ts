import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { updateTutorExpertiseService } from "../services/tutor.service";

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
