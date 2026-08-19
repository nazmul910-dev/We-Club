import { Router } from "express";

import {
  authorizeRoles,
  verifyToken,
} from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";

import { notificationTemplateController } from "./notification.template.controller";
import {
  createNotificationTemplateValidation,
  getNotificationTemplatesValidation,
  notificationTemplateIdValidation,
  updateNotificationTemplateValidation,
} from "./notification.template.validation";

const router = Router();

const ADMIN_ROLES = [
  "founder",
  "super_admin",
  "admin",
  "manager",
] as const;

router.get(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(getNotificationTemplatesValidation),
  notificationTemplateController.getTemplates,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(notificationTemplateIdValidation),
  notificationTemplateController.getSingleTemplate,
);

router.post(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(createNotificationTemplateValidation),
  notificationTemplateController.createTemplate,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(updateNotificationTemplateValidation),
  notificationTemplateController.updateTemplate,
);

export const notificationTemplateRoutes = router;
