import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";
import mongoose, { PipelineStage } from "mongoose";
import userModel, { UserRole } from "../models/user.model";

// Định nghĩa kiểu dữ liệu cho options đầu vào
interface IGrowthChartOptions {
  granularity?: "daily" | "monthly";
  days?: number;
}

// Định nghĩa kiểu dữ liệu cho kết quả trả về
interface IChartDataPoint {
  date: string;
  newStudents: number;
  newTutors: number;
}

export const getUserGrowthChartService = async (
  options: IGrowthChartOptions = {}
): Promise<IChartDataPoint[]> => {
  // 1. Thiết lập các giá trị mặc định
  const { granularity = "daily", days = 30 } = options;
  const today = new Date();
  const startDate = startOfDay(subDays(today, days - 1));

  // 2. Xây dựng MongoDB Aggregation Pipeline
  const pipeline: PipelineStage[] = [
    // --- STAGE 1: Lọc các user được tạo trong khoảng thời gian cần xem ---
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    // --- STAGE 2: Nhóm các user lại theo ngày hoặc tháng ---
    {
      $group: {
        _id: {
          // Định dạng nhóm theo năm-tháng-ngày hoặc năm-tháng
          $dateToString: {
            format: granularity === "daily" ? "%Y-%m-%d" : "%Y-%m",
            date: "$createdAt",
          },
        },
        // Đếm có điều kiện: chỉ cộng 1 nếu role khớp
        newStudents: {
          $sum: {
            $cond: [{ $eq: ["$role", UserRole.Student] }, 1, 0],
          },
        },
        newTutors: {
          $sum: {
            $cond: [{ $eq: ["$role", UserRole.Tutor] }, 1, 0],
          },
        },
      },
    },
    // --- STAGE 3: Đổi tên trường _id thành date cho đẹp hơn ---
    {
      $project: {
        _id: 0, // Bỏ trường _id
        date: "$_id",
        newStudents: 1, // Dùng 1 để bao gồm trường này
        newTutors: 1, // Dùng 1 để bao gồm trường này
      },
    },
    // --- STAGE 4: Sắp xếp kết quả theo ngày tăng dần ---
    {
      $sort: {
        date: 1,
      },
    },
  ];

  const results: IChartDataPoint[] = await userModel.aggregate(pipeline);

  // 3. Xử lý lấp đầy những ngày không có dữ liệu (để biểu đồ không bị gãy)
  const dateMap = new Map<string, IChartDataPoint>();
  results.forEach((item) => dateMap.set(item.date, item));

  const fullDateRange = eachDayOfInterval({ start: startDate, end: today });

  const chartData: IChartDataPoint[] = fullDateRange.map((day) => {
    const dateString = format(day, "yyyy-MM-dd");
    if (dateMap.has(dateString)) {
      return dateMap.get(dateString)!;
    } else {
      return {
        date: dateString,
        newStudents: 0,
        newTutors: 0,
      };
    }
  });

  return chartData;
};
