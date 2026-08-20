import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";

import { streakLogController } from "./streaklog.controller";
import {
  createStreakLogValidation,
  getStreakLogsValidation,
  streakLogIdValidation,
} from "./streaklog.validation";

const ADMIN_ROLES = ["founder", "super_admin", "admin", "manager"] as const;

const router = Router();

router.post(
  "/",
  verifyToken,
  validateRequest(createStreakLogValidation),
  streakLogController.createStreakLog,
);

router.get(
  "/me",
  verifyToken,
  streakLogController.getMyStreakLogs,
);

router.get(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(getStreakLogsValidation),
  streakLogController.getStreakLogs,
);

router.get(
  "/:id",
  verifyToken,
  validateRequest(streakLogIdValidation),
  streakLogController.getSingleStreakLog,
);

export const streakLogRoutes = router;
