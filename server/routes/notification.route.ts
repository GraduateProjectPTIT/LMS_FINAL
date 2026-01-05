import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  getAllNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  getMyNotifications,
  createNotification,
  notificationStreamController,
} from "../controllers/notification.controller";

const notificationRouter = express.Router();

notificationRouter.get(
  "/notification/get_all_notifications",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllNotifications
);

notificationRouter.post(
  "/notification/create_notification",
  isAuthenticated,
  createNotification
);

notificationRouter.put(
  "/notification/:id/read",
  isAuthenticated,
  authorizeRoles("admin", "tutor", "student"),
  markMyNotificationRead
);

notificationRouter.put(
  "/notification/my/read_all",
  isAuthenticated,
  authorizeRoles("admin", "tutor", "student"),
  markAllMyNotificationsRead
);

notificationRouter.get(
  "/notification/my",
  isAuthenticated,
  authorizeRoles("admin", "tutor", "student"),
  getMyNotifications
);

notificationRouter.get(
  "/notification/stream",
  isAuthenticated,
  notificationStreamController
);

export default notificationRouter;
