import { Router } from "express";

import { verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { invictusPaymentController } from "./invictus.payment.controller";

import { createInvictusCheckoutValidation } from "./invictus.payment.validation";

const router = Router();

router.post(
  "/checkout",
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    createInvictusCheckoutValidation
  ),
  invictusPaymentController
    .createInvictusCheckoutSession
);

router.get(
  "/my-purchases",
  verifyToken,
  requireInvictusAccess,
  invictusPaymentController
    .getMyInvictusPurchases
);

export const invictusPaymentRoutes =
  router;
