import express from "express";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import {
  getTutorOverview,
  setupTutorProfile,
} from "../controllers/tutor.controller";
const tutorRouter = express.Router();

tutorRouter.put(
  "/tutor/tutor-profile-register",
  isAuthenticated,
  authorizeRoles("tutor"),
  setupTutorProfile
);

tutorRouter.get(
  "/tutor/overview/:id/",
  isAuthenticated,
  authorizeRoles("tutor"),
  getTutorOverview
);

export default tutorRouter;
