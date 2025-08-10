// src/routes/auth.route.ts
import express from "express";
import {
  register,
  activateUser,
  login,
  logout,
  updateAccessToken,
  socialAuth,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/auth"; // Giả sử bạn có middleware này

const authRouter = express.Router();

authRouter.post("/auth/register", register);
authRouter.post("/auth/activate", activateUser);
authRouter.post("/auth/login", login);
authRouter.post("/auth/social_auth", socialAuth);
authRouter.post("/auth/forgot-password", forgotPassword);
authRouter.put("/auth/reset-password/:token", resetPassword);

// Các route này yêu cầu người dùng phải đăng nhập
authRouter.post("/auth/logout", isAuthenticated, logout);
authRouter.get("/auth/refresh_token", isAuthenticated, updateAccessToken);

export default authRouter;
