import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { challengePillarController } from "./challenge.pillar.controller";

import {
  challengePillarIdValidation,
  challengePillarSlugValidation,
  createChallengePillarValidation,
  updateChallengePillarValidation,
} from "./challenge.pillar.validation";

const router = Router();

router.post(
  "/seed-defaults",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  challengePillarController.seedDefaultChallengePillars,
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(createChallengePillarValidation),
  challengePillarController.createChallengePillar,
);

router.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  challengePillarController.getAllChallengePillars,
);

router.get(
  "/:slug",
  verifyToken,
  requireInvictusAccess,
  validateRequest(challengePillarSlugValidation),
  challengePillarController.getChallengePillarBySlug,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(updateChallengePillarValidation),
  challengePillarController.updateChallengePillar,
);

router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(challengePillarIdValidation),
  challengePillarController.publishChallengePillar,
);

router.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(challengePillarIdValidation),
  challengePillarController.moveChallengePillarToDraft,
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(challengePillarIdValidation),
  challengePillarController.archiveChallengePillar,
);

export const challengePillarRoutes = router;
