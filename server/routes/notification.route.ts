import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  getAllNotifications,
  updateNotification,
  getTutorPurchaseNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  getMyNotifications,
} from "../controllers/notification.controller";

const notificationRouter = express.Router();

notificationRouter.get(
  "/notification/get_all_notifications",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllNotifications
);
notificationRouter.put(
  "/notification/update_notification/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateNotification
);

notificationRouter.get(
  "/notification/my/purchases",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  getTutorPurchaseNotifications
);

notificationRouter.put(
  "/notification/my/:id/read",
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

export default notificationRouter;
