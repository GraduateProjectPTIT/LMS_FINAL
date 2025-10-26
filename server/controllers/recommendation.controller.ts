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

const getTestRecommendations = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Lấy userId từ URL (req.params)
    const { userId } = req.params;

    if (!userId) {
      return next(new ErrorHandler("Please provide a userId in the URL", 400));
    }

    // 2. Lấy 'limit' từ query (tương tự)
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;
    if (isNaN(limit) || limit <= 0) {
      return next(new ErrorHandler("Invalid 'limit' parameter", 400));
    }

    // 3. Gọi CÙNG MỘT service
    // Service của bạn không quan tâm ID đến từ đâu (token hay URL)
    const recommendations =
      await recommendationService.getRecommendationsForUser(userId, limit);

    // 4. Trả về kết quả
    res.status(200).json({
      success: true,
      testingUserId: userId, // Thêm dòng này để biết bạn đang test user nào
      recommendations,
    });
  }
);

// Export theo cấu trúc của bạn
export const recommendationController = {
  getRecommendations,
  getTestRecommendations, // <--- Thêm hàm mới
};
