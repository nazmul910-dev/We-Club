import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { userEntitlementController } from "./userEntitlements.controller";

import {
  entitlementIdValidation,
  entitlementStatusValidation,
  getAllEntitlementsValidation,
  grantUserEntitlementValidation,
  pillarAccessValidation,
  reactivateEntitlementValidation,
} from "./userEntitlements.validation";

const router = Router();

/**
 * Admin/Manager manually grants access.
 */
router.post(
  "/grant",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(grantUserEntitlementValidation),
  userEntitlementController.grantEntitlement,
);

/**
 * Logged-in user gets own entitlements.
 */
router.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  userEntitlementController.getMyEntitlements,
);

/**
 * Check whether logged-in user can access
 * a specific challenge pillar.
 */
router.get(
  "/check/pillar/:pillarId",
  verifyToken,
  requireInvictusAccess,
  validateRequest(pillarAccessValidation),
  userEntitlementController.checkPillarAccess,
);

/**
 * Admin/Manager entitlement list.
 */
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(getAllEntitlementsValidation),
  userEntitlementController.getAllEntitlements,
);

/**
 * Admin/Manager single entitlement.
 */
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(entitlementIdValidation),
  userEntitlementController.getSingleEntitlement,
);

router.patch(
  "/:id/revoke",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(entitlementStatusValidation),
  userEntitlementController.revokeEntitlement,
);

/**
 * Refund status should normally be set by
 * Stripe webhook or Admin.
 */
router.patch(
  "/:id/refund",
  verifyToken,
  authorizeRoles("admin"),
  validateRequest(entitlementStatusValidation),
  userEntitlementController.refundEntitlement,
);

router.patch(
  "/:id/expire",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(entitlementStatusValidation),
  userEntitlementController.expireEntitlement,
);

router.patch(
  "/:id/reactivate",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(reactivateEntitlementValidation),
  userEntitlementController.reactivateEntitlement,
);

export const userEntitlementRoutes = router;
