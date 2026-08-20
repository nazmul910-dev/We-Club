import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import validateRequest from "../../utility/validateRequest";

import { activityLogController } from "./activitylog.controller";

import {
  activityLogIdValidation,
  createActivityLogValidation,
  getAllActivityLogsValidation,
} from "./activitylog.validation";

const router = Router();

/**
 * সাধারণত এটি অন্য module থেকে internally কল হবে
 * (admin action-এর পর activityLogService.createActivityLog),
 * তবে manual entry-এর জন্যও endpoint রাখা হলো।
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager", "founder", "super_admin"),
  validateRequest(createActivityLogValidation),
  activityLogController.createActivityLog,
);

/**
 * Admin/Manager full activity feed — filter সহ।
 */
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager", "founder", "super_admin"),
  validateRequest(getAllActivityLogsValidation),
  activityLogController.getAllActivityLogs,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager", "founder", "super_admin"),
  validateRequest(activityLogIdValidation),
  activityLogController.getSingleActivityLog,
);

export const activityLogRoutes = router;