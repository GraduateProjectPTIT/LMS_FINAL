import express from "express";

import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import {
  createEnrollment,
  getAllUsers,
  getUserDetail,
} from "../controllers/admin.controller";
const adminRouter = express.Router();

adminRouter.get(
  "/admin/get_all_users",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsers
);

adminRouter.get(
  "/admin/get_user_detail/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserDetail
);

adminRouter.post("/admin/enrollments", createEnrollment); // <-- ROUTE MỚI
// adminRouter.put(
//   "/admin/update-user-role",
//   isAuthenticated,
//   authorizeRoles("admin"),
//   updateUserRole
// );
// adminRouter.delete(
//   "/admin/delete-user/:id",
//   isAuthenticated,
//   authorizeRoles("admin"),
//   deleteUser
// );

export default adminRouter;
