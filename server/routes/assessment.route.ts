import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  submitAssessment,
  gradeAssessment,
  getAssessments,
  getCertificate,
} from "../controllers/assessment.controller";

const assessmentRouter = express.Router();

assessmentRouter.post(
  "/submit-assessment",
  isAuthenticated,
  submitAssessment
);

assessmentRouter.post(
  "/grade-assessment",
  isAuthenticated,
  authorizeRoles("tutor"),
  gradeAssessment
);

assessmentRouter.get(
  "/get-assessments",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  getAssessments
);

assessmentRouter.get(
  "/certificate/:courseId",
  isAuthenticated,
  getCertificate
);

export default assessmentRouter;
