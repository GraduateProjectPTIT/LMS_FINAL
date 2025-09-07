import { Request, Response, NextFunction } from "express";
import { getUserGrowthChartService } from "../services/statistics.service";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// Controller để lấy dữ liệu biểu đồ tăng trưởng user
export const getUserGrowthChart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Lấy các query params, có thể là undefined
    const { granularity, days: daysStr } = req.query;

    // Chuyển đổi và validation đầu vào
    let validatedGranularity: "daily" | "monthly" = "daily";

    if (granularity === "monthly") {
      validatedGranularity = "monthly";
    }

    const days = daysStr ? parseInt(daysStr as string, 10) : 30;
    if (isNaN(days) || days <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid 'days' parameter." });
    }

    const options = {
      granularity: validatedGranularity,
      days: days,
    };

    const chartData = await getUserGrowthChartService(options);

    res.status(200).json({
      success: true,
      chartData,
    });
  }
);
