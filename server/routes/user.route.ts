// src/routes/user.route.ts
import express from "express";
import {
  getUserInfo,
  updateUserInfo,
  updatePassword,
  deleteMyAccount,
  updateAvatar,
} from "../controllers/user.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
const userRouter = express.Router();

// Các route cho người dùng thông thường (đã đăng nhập)
userRouter.get("/user/me", isAuthenticated, getUserInfo);
userRouter.put("/user/update_user_info", isAuthenticated, updateUserInfo);
userRouter.put("/user/update_avatar", isAuthenticated, updateAvatar);
userRouter.put("/user/update_password", isAuthenticated, updatePassword);
userRouter.delete("/user/me", isAuthenticated, deleteMyAccount);

export default userRouter;
