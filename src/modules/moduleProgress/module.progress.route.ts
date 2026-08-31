import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { moduleProgressController } from "./module.progress.controller";

import {
  adminModuleProgressValidation,
  getAllModuleProgressValidation,
  moduleProgressModuleIdValidation,
} from "./module.progress.validation";

const router = Router();

router.get(
  "/me/module/:moduleId",

  verifyToken,

  requireInvictusAccess,

  validateRequest(moduleProgressModuleIdValidation),

  moduleProgressController.getMyModuleProgress,
);

router.post(
  "/me/module/:moduleId/recalculate",

  verifyToken,

  requireInvictusAccess,

  validateRequest(moduleProgressModuleIdValidation),

  moduleProgressController.recalculateMyModuleProgress,
);

router.get(
  "/me",

  verifyToken,

  requireInvictusAccess,

  moduleProgressController.getMyAllModuleProgress,
);

router.get(
  "/user/:userId/module/:moduleId",

  verifyToken,

  authorizeRoles("admin", "manager","founder"),

  validateRequest(adminModuleProgressValidation),

  moduleProgressController.getUserModuleProgress,
);

router.get(
  "/",

  verifyToken,

  authorizeRoles("admin", "manager",'founder'),

  validateRequest(getAllModuleProgressValidation),

  moduleProgressController.getAllModuleProgress,
);

export const moduleProgressRoutes = router;
