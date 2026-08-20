import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import validateRequest from "../../utility/validateRequest";

import { entitlementLogController } from "./entitlementlog.controller";

import {
  createEntitlementLogValidation,
  entitlementLogIdValidation,
  getAllEntitlementLogsValidation,
} from "./entitlementlog.validaiton";

const router = Router();

/**
 * Admin/Manager manually একটা log তৈরি করতে পারে,
 * তবে সাধারণত এটি অন্য service (userEntitlements) থেকে
 * internally কল হবে।
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(createEntitlementLogValidation),
  entitlementLogController.createEntitlementLog,
);

/**
 * Logged-in user নিজের entitlement history দেখতে পারবে।
 */
router.get(
  "/me",
  verifyToken,
  entitlementLogController.getMyEntitlementLogs,
);

/**
 * Admin/Manager full audit log list — filter সহ।
 */
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(getAllEntitlementLogsValidation),
  entitlementLogController.getAllEntitlementLogs,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(entitlementLogIdValidation),
  entitlementLogController.getSingleEntitlementLog,
);

export const entitlementLogRoutes = router;