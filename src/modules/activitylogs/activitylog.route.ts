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

router.post(
  "/",
  verifyToken,
  authorizeRoles( "founder", "super_admin"),
  validateRequest(createActivityLogValidation),
  activityLogController.createActivityLog,
);


router.get(
  "/",
  verifyToken,
  authorizeRoles("manager", "founder", "super_admin"),
  validateRequest(getAllActivityLogsValidation),
  activityLogController.getAllActivityLogs,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("manager", "founder", "super_admin"),
  validateRequest(activityLogIdValidation),
  activityLogController.getSingleActivityLog,
);

export const activityLogRoutes = router;