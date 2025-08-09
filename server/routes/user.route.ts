// src/routes/user.route.ts
import express from "express";
import {
  getUserInfo,
  updateUserInfo,
  updateProfilePicture,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/user.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth"; // Giả sử bạn có middleware
import multer from "multer";

const userRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("avatar");

// Các route cho người dùng thông thường (đã đăng nhập)
userRouter.get("/user/me", isAuthenticated, getUserInfo);
userRouter.put("/user/update-info", isAuthenticated, updateUserInfo);
userRouter.put(
  "/user/update-avatar",
  isAuthenticated,
  upload,
  updateProfilePicture
);

// Các route cho quản trị viên (Admin)
userRouter.get(
  "/user/get-all-users",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsers
);
userRouter.put(
  "/user/update-user-role",
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRole
);
userRouter.delete(
  "/user/delete-user/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteUser
);

export default userRouter;
