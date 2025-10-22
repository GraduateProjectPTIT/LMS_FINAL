import { Request, Response, NextFunction } from "express";
import { recommendationService } from "../services/recommendation.service";
// Giả sử bạn import CatchAsyncError và ErrorHandler từ một file utils
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";

/**
 * Controller để lấy các khóa học được đề xuất cho người dùng đã đăng nhập.
 * Đã được bọc trong CatchAsyncError.
 */
const getRecommendations = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Giả định: Middleware 'isAuthenticated' đã chạy
    const user = (req as any).user;

    if (!user || !user._id) {
      // Gọi next(error) thay vì return res.json()
      // CatchAsyncError sẽ bắt lỗi này
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const userId = user._id;

    // Lấy 'limit' từ query params
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;

    // Kiểm tra nếu limit không hợp lệ
    if (isNaN(limit) || limit <= 0) {
      return next(new ErrorHandler("Invalid 'limit' parameter", 400));
    }

    // Gọi service
    const recommendations =
      await recommendationService.getRecommendationsForUser(userId, limit);

    // Gửi phản hồi thành công (Không 'return' ở đây)
    res.status(200).json({
      success: true,
      recommendations,
    });
  }
);

// Export theo cấu trúc của bạn
export const recommendationController = {
  getRecommendations,
};
