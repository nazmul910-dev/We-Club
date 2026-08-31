import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import validateRequest from "../../utility/validateRequest";

import { sessionScheduleController } from "./sessionschedules.controller";

import {
  cancelSessionScheduleValidation,
  createSessionScheduleValidation,
  getAllSessionSchedulesValidation,
  sessionScheduleIdValidation,
  updateSessionScheduleValidation,
} from "./sessionschedules.validation";

const router = Router();


router.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(createSessionScheduleValidation),
  sessionScheduleController.createSessionSchedule,
);

router.get(
  "/",
  verifyToken,
  validateRequest(getAllSessionSchedulesValidation),
  sessionScheduleController.getAllSessionSchedules,
);

router.get(
  "/:id",
  verifyToken,
  validateRequest(sessionScheduleIdValidation),
  sessionScheduleController.getSingleSessionSchedule,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(updateSessionScheduleValidation),
  sessionScheduleController.updateSessionSchedule,
);

router.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(cancelSessionScheduleValidation),
  sessionScheduleController.cancelSessionSchedule,
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(sessionScheduleIdValidation),
  sessionScheduleController.deleteSessionSchedule,
);

export const sessionScheduleRoutes = router;