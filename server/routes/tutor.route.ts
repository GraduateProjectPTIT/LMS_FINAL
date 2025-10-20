import express from "express";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import {
  getTutorOverview,
  setupTutorProfile,
  getTutorDashboardSummary,
  getTutorEarnings,
} from "../controllers/tutor.controller";
const tutorRouter = express.Router();

tutorRouter.put(
  "/tutor/tutor-profile-register",
  isAuthenticated,
  authorizeRoles("tutor"),
  setupTutorProfile
);

tutorRouter.get("/tutor/overview/:id/", isAuthenticated, getTutorOverview);

export default tutorRouter;

tutorRouter.get(
  "/tutor/dashboard/summary",
  isAuthenticated,
  authorizeRoles("tutor"),
  getTutorDashboardSummary
);

tutorRouter.get(
  "/tutor/dashboard/earnings",
  isAuthenticated,
  authorizeRoles("tutor"),
  getTutorEarnings
);
