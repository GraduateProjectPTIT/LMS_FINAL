import express from "express"
import { authorizeRoles, isAuthenticated } from "../middleware/auth"
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from "../controllers/analytics.controller";

const analyticsRouter = express.Router();

analyticsRouter.get("/analytic/get_users_analytics", isAuthenticated, authorizeRoles("admin"), getUserAnalytics);
analyticsRouter.get("/analytic/get_courses_analytics", isAuthenticated, authorizeRoles("admin"), getCourseAnalytics);
analyticsRouter.get("/analytic/get_orders_analytics", isAuthenticated, authorizeRoles("admin"), getOrderAnalytics);

export default analyticsRouter;