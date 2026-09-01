import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import validateRequest from "../../utility/validateRequest";

import { sessionAttendanceController } from "./sessionattendances.controller";

import {
  cancelSessionAttendanceValidation,
  getAllSessionAttendancesValidation,
  markSessionAttendanceValidation,
  registerSessionAttendanceValidation,
  sessionAttendanceIdValidation,
} from "./sessionattendances.validation";

const router = Router();


router.post(
  "/register",
  verifyToken,
  validateRequest(registerSessionAttendanceValidation),
  sessionAttendanceController.registerSessionAttendance,
);

router.post(
  "/mark",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(markSessionAttendanceValidation),
  sessionAttendanceController.markSessionAttendance,
);

router.post(
  "/cancel",
  verifyToken,
  validateRequest(cancelSessionAttendanceValidation),
  sessionAttendanceController.cancelSessionAttendance,
);

router.get(
  "/me",
  verifyToken,
  sessionAttendanceController.getMySessionAttendances,
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(getAllSessionAttendancesValidation),
  sessionAttendanceController.getAllSessionAttendances,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(sessionAttendanceIdValidation),
  sessionAttendanceController.getSingleSessionAttendance,
);

export const sessionAttendanceRoutes = router;