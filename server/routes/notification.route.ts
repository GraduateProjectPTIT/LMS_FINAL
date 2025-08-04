import express from "express"
import { authorizeRoles, isAuthenticated } from "../middleware/auth"
import { getAllNotifications, updateNotification } from "../controllers/notification.controller"
import { updateAccessToken } from "../controllers/user.controller"

const notificationRouter = express.Router()

notificationRouter.get("/notification/get_all_notifications", isAuthenticated, authorizeRoles("admin"), getAllNotifications);
notificationRouter.put("/notification/update_notification/:id", isAuthenticated, authorizeRoles("admin"), updateNotification);

export default notificationRouter;
