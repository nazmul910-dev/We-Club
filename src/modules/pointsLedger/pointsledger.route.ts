import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";

import { pointsLedgerController } from "./pointsledger.controller";
import {
  createPointsLedgerValidation,
  getPointsLedgerValidation,
  pointsLedgerIdValidation,
} from "./pointsledger.validation";

const ADMIN_ROLES = ["founder", "super_admin", "admin", "manager"] as const;

const router = Router();

router.post(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(createPointsLedgerValidation),
  pointsLedgerController.createPointsLedger,
);

router.get(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest(getPointsLedgerValidation),
  pointsLedgerController.getPointsLedger,
);

router.get(
  "/:id",
  verifyToken,
  validateRequest(pointsLedgerIdValidation),
  pointsLedgerController.getSinglePointsLedger,
);

export const pointsLedgerRoutes = router;
