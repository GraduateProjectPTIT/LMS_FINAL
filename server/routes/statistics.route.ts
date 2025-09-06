import express from "express";
import { getUserGrowthChart } from "../controllers/statistics.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";

const statisticsRouter = express.Router();

// Route lấy overview thống kê (đã có)
// statisticsRouter.get(
//   "/users-overview",
//   isAuthenticated,
//   authorizeRoles("admin"),
//   getUserStatistics
// );

// THÊM MỚI: Route lấy dữ liệu biểu đồ tăng trưởng
statisticsRouter.get(
  "/user-growth-chart",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserGrowthChart
);

export default statisticsRouter;
