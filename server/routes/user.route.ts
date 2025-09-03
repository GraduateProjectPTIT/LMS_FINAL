// src/routes/user.route.ts
import express from "express";
import {
  getUserInfo,
  updateUserInfo,
  getAllUsers,
  updateUserRole,
  deleteUser,
  updatePassword,
  deleteMyAccount,
  updateAvatar,
  setupProfile,
} from "../controllers/user.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
const userRouter = express.Router();

// Các route cho người dùng thông thường (đã đăng nhập)
userRouter.get("/user/me", isAuthenticated, getUserInfo);
userRouter.put("/user/update_user_info", isAuthenticated, updateUserInfo);
userRouter.put("/user/update_avatar", isAuthenticated, updateAvatar);
userRouter.put("/user/update_password", isAuthenticated, updatePassword);
userRouter.put("/user/setup-profile", isAuthenticated, setupProfile);

// Các route cho quản trị viên (Admin)
userRouter.get(
  "/user/get_all_users",
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

userRouter.delete("/user/me", isAuthenticated, deleteMyAccount);

export default userRouter;
