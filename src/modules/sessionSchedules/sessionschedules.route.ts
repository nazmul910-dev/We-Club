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
  authorizeRoles( "manager", "founder"),
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
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(updateSessionScheduleValidation),
  sessionScheduleController.updateSessionSchedule,
);

router.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(cancelSessionScheduleValidation),
  sessionScheduleController.cancelSessionSchedule,
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "founder"),
  validateRequest(sessionScheduleIdValidation),
  sessionScheduleController.deleteSessionSchedule,
);

export const sessionScheduleRoutes = router;