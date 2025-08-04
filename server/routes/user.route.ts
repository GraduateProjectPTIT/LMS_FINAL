import express from "express"
import { activateUser, deleteUser, getAllUsers, getUserInfo, login, logout, register, socialAuth, updateAccessToken, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole } from "../controllers/user.controller"
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const userRouter = express.Router()

userRouter.post('/auth/register', register);
userRouter.post('/auth/activate', activateUser);
userRouter.post('/auth/login', login);
userRouter.post('/auth/logout', isAuthenticated, logout);
userRouter.get('/auth/refresh_token', updateAccessToken);
userRouter.post('/auth/social_auth', socialAuth);

userRouter.get('/user/me', isAuthenticated, getUserInfo);
userRouter.put('/user/update_user_info', isAuthenticated, updateUserInfo);
userRouter.put('/user/update_password', isAuthenticated, updatePassword);
userRouter.put("/user/update_profile_picture", isAuthenticated, updateProfilePicture);
userRouter.get('/user/get_all_users', isAuthenticated, authorizeRoles("admin"), getAllUsers);
userRouter.put('/user/update_role', isAuthenticated, authorizeRoles("admin"), updateUserRole);
userRouter.delete("/user/delete_user/:id", isAuthenticated, authorizeRoles("admin"), deleteUser);

export default userRouter;