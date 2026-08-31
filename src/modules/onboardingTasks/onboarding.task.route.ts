import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { onboardingTaskController } from "./onboarding.task.controller";

import {
  createOnboardingTaskValidation,
  onboardingTaskIdValidation,
  updateOnboardingTaskValidation,
} from "./onboarding.task.validation";

const router = Router();

/* ---------------------------- user-facing ---------------------------- */

router.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  onboardingTaskController.getMyChecklist,
);

router.patch(
  "/:id/complete",
  verifyToken,
  requireInvictusAccess,
  validateRequest(onboardingTaskIdValidation),
  onboardingTaskController.completeMyTask,
);

/* ------------------------------ admin ---------------------------------- */

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(createOnboardingTaskValidation),
  onboardingTaskController.createOnboardingTask,
);

router.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  onboardingTaskController.getAllOnboardingTasks,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(updateOnboardingTaskValidation),
  onboardingTaskController.updateOnboardingTask,
);

router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(onboardingTaskIdValidation),
  onboardingTaskController.publishOnboardingTask,
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(onboardingTaskIdValidation),
  onboardingTaskController.archiveOnboardingTask,
);

export const onboardingTaskRoutes = router;