import express from "express";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import { setupStudentProfile } from "../controllers/student.controller";
import { setupTutorProfile } from "../controllers/tutor.controller";
const tutorRouter = express.Router();

tutorRouter.put(
  "/tutor/tutor-profile-register",
  isAuthenticated,
  authorizeRoles("tutor"),
  setupTutorProfile
);

export default tutorRouter;
