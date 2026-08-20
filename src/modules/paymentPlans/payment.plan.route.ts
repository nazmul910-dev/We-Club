import { Router } from "express";

import {
  authorizeRoles,
  verifyToken,
} from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { paymentPlanController } from "./payment.plan.controller";

import {
  createPaymentPlanValidation,
  paymentPlanIdValidation,
  paymentPlanSlugValidation,
  updatePaymentPlanValidation,
} from "./payment.plan.validation";

const router = Router();

router.post(
  "/",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest(
    createPaymentPlanValidation
  ),
  paymentPlanController
    .createPaymentPlan
);

router.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  paymentPlanController
    .getAllPaymentPlans
);

router.get(
  "/slug/:slug",
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    paymentPlanSlugValidation
  ),
  paymentPlanController
    .getPaymentPlanBySlug
);

router.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    paymentPlanIdValidation
  ),
  paymentPlanController
    .getSinglePaymentPlan
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest(
    updatePaymentPlanValidation
  ),
  paymentPlanController
    .updatePaymentPlan
);

router.patch(
  "/:id/activate",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest(
    paymentPlanIdValidation
  ),
  paymentPlanController
    .activatePaymentPlan
);

router.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest(
    paymentPlanIdValidation
  ),
  paymentPlanController
    .deactivatePaymentPlan
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest(
    paymentPlanIdValidation
  ),
  paymentPlanController
    .archivePaymentPlan
);

export const paymentPlanRoutes =
  router;
