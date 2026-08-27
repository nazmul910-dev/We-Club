import { Router } from "express";

import {
  authorizeRoles,
  verifyToken,
} from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { moduleActionController } from "./module.action.controller";

import {
  createModuleActionValidation,
  moduleActionIdValidation,
  moduleActionModuleValidation,
  updateModuleActionValidation,
} from "./module.action.validation";

const router = Router();

router.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    createModuleActionValidation
  ),
  moduleActionController
    .createModuleAction
);

router.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  moduleActionController
    .getAllModuleActions
);

router.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    moduleActionModuleValidation
  ),
  moduleActionController
    .getActionsByModule
);

router.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    moduleActionIdValidation
  ),
  moduleActionController
    .getSingleModuleAction
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    updateModuleActionValidation
  ),
  moduleActionController
    .updateModuleAction
);

router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    moduleActionIdValidation
  ),
  moduleActionController
    .publishModuleAction
);

router.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    moduleActionIdValidation
  ),
  moduleActionController
    .moveModuleActionToDraft
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    moduleActionIdValidation
  ),
  moduleActionController
    .archiveModuleAction
);

export const moduleActionRoutes =
  router;