import { Router } from "express";

import {
  authorizeRoles,
  verifyToken,
} from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";

import { notificationController } from "./notification.controller";
import {
  createNotificationFromTemplateValidation,
  createNotificationValidation,
  getAllNotificationsValidation,
  getMyNotificationsValidation,
  notificationIdValidation,
} from "./notification.validation";

const router = Router();

const ADMIN_ROLES = [
  "founder",
  "super_admin",
  "admin",
  "manager",
] as const;

// User routes.
// Only verifyToken is used intentionally so a logged-in user can still read
// notifications about access/payment/approval changes.
router.get(
  "/me",
  verifyToken,
  validateRequest(getMyNotificationsValidation),
  notificationController.getMyNotifications,
);

router.get(
  "/me/unread-count",
  verifyToken,
  notificationController.getMyUnreadCount,
);

router.patch(
  "/me/read-all",
  verifyToken,
  notificationController.markAllAsRead,
);

router.patch(
  "/me/:id/read",
  verifyToken,
  validateRequest(notificationIdValidation),
  notificationController.markOneAsRead,
);

router.patch(
  "/me/:id/unread",
  verifyToken,
  validateRequest(notificationIdValidation),
  notificationController.markOneAsUnread,
);

// Admin/manual testing routes.
router.post(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(createNotificationValidation),
  notificationController.createManualNotification,
);

router.post(
  "/from-template",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(createNotificationFromTemplateValidation),
  notificationController.createFromTemplate,
);

router.get(
  "/admin",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(getAllNotificationsValidation),
  notificationController.getAllNotificationsAdmin,
);

export const notificationRoutes = router;
