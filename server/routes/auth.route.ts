// src/routes/auth.route.ts
import express from "express";
import {
  register,
  activateUser,
  login,
  logout,
  updateAccessToken,
  socialLoginCheck,
  socialRegister,
  forgotPassword,
  resetPassword,
  resendCode,
} from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/auth"; // Giả sử bạn có middleware này

const authRouter = express.Router();

authRouter.post("/auth/register", register);
authRouter.post("/auth/activate", activateUser);
authRouter.post("/auth/login", login);
authRouter.post("/auth/social_check", socialLoginCheck);
authRouter.post("/auth/social_register", socialRegister);

authRouter.post("/auth/forgot_password", forgotPassword);
authRouter.put("/auth/reset_password", resetPassword);
authRouter.post("/auth/resend_activation_code", resendCode);

// Các route này yêu cầu người dùng phải đăng nhập
authRouter.post("/auth/logout", isAuthenticated, logout);
authRouter.get("/auth/refresh_token", isAuthenticated, updateAccessToken);

export default authRouter;
