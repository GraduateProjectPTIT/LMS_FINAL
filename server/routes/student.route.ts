import express from "express";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import { setupStudentProfile } from "../controllers/student.controller";
const studentRouter = express.Router();

studentRouter.put(
  "/student/student-profile-register",
  isAuthenticated,
  authorizeRoles("student"),
  setupStudentProfile
);

export default studentRouter;
