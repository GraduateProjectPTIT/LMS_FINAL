// src/routes/auth.route.ts
import express from "express";
import {
  register,
  activateUser,
  login,
  logout,
  updateAccessToken,
  socialAuth,
  updatePassword,
} from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/auth"; // Giả sử bạn có middleware này

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/activate-user", activateUser);
authRouter.post("/login", login);
authRouter.post("/social-auth", socialAuth);

// Các route này yêu cầu người dùng phải đăng nhập
authRouter.get("/logout", isAuthenticated, logout);
authRouter.get("/refresh-token", isAuthenticated, updateAccessToken);
authRouter.put("/update-password", isAuthenticated, updatePassword);

export default authRouter;
