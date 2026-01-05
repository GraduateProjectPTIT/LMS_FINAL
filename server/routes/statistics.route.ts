import express from "express";
import {
  getAdminCourseInsights,
  getCourseAnalytics,
  getOrderAnalytics,
  getStudentCourseProgress,
  getStudentLearningSummary,
  getTutorDashboardStats,
  getTutorStudentsProgress,
  getUserAnalytics,
  getUserGrowthChart,
} from "../controllers/statistics.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";

const statisticsRouter = express.Router();

statisticsRouter.get(
  "/statistics/user-growth-chart",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserGrowthChart
);

statisticsRouter.get(
  "/analytic/get_users_analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnalytics
);
statisticsRouter.get(
  "/analytic/get_courses_analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getCourseAnalytics
);
statisticsRouter.get(
  "/analytic/get_orders_analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getOrderAnalytics
);

statisticsRouter.get(
  "/analytic/student/learning_summary",
  isAuthenticated,
  getStudentLearningSummary
);
statisticsRouter.get(
  "/analytic/student/course_progress",
  isAuthenticated,
  getStudentCourseProgress
);

statisticsRouter.get(
  "/analytic/tutor/dashboard_stats",
  isAuthenticated,
  authorizeRoles("tutor", "admin"),
  getTutorDashboardStats
);
statisticsRouter.get(
  "/analytic/tutor/students_progress",
  isAuthenticated,
  authorizeRoles("tutor", "admin"),
  getTutorStudentsProgress
);

statisticsRouter.get(
  "/analytic/admin/course_insights",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminCourseInsights
);

export default statisticsRouter;
