import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";
import validateRequest from "../../utility/validateRequest";

import { retreatBookingController } from "./retreat.booking.controller";
import {
  cancelRetreatBookingValidation,
  confirmRetreatBookingAdminValidation,
  createRetreatBookingValidation,
  inviteRetreatBookingValidation,
  queryRetreatBookingValidation,
  refundRetreatBookingValidation,
  retreatBookingIdValidation,
  updateRetreatBookingValidation,
} from "./retreat.booking.validation";

const router = Router();

// Member Routes
router.post(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest(createRetreatBookingValidation),
  retreatBookingController.createRetreatBooking,
);

router.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest(queryRetreatBookingValidation),
  retreatBookingController.getMyRetreatBookings,
);

router.get(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(retreatBookingIdValidation),
  retreatBookingController.getMySingleRetreatBooking,
);

router.patch(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(updateRetreatBookingValidation),
  retreatBookingController.updateRetreatBooking,
);

router.patch(
  "/me/:id/cancel",
  verifyToken,
  requireInvictusAccess,
  validateRequest(cancelRetreatBookingValidation),
  retreatBookingController.cancelRetreatBooking,
);

router.post(
  "/me/:id/checkout",
  verifyToken,
  requireInvictusAccess,
  validateRequest(retreatBookingIdValidation),
  retreatBookingController.createCheckoutSession,
);

router.post(
  "/verify-payment",
  verifyToken,
  retreatBookingController.verifyPayment,
);

// Admin Action Routes
router.patch(
  "/:id/invite",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(inviteRetreatBookingValidation),
  retreatBookingController.inviteRetreatBooking,
);

router.patch(
  "/:id/confirm",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(confirmRetreatBookingAdminValidation),
  retreatBookingController.confirmRetreatBookingAdmin,
);

router.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(cancelRetreatBookingValidation),
  retreatBookingController.cancelRetreatBooking,
);

router.patch(
  "/:id/refund",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(refundRetreatBookingValidation),
  retreatBookingController.refundRetreatBooking,
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(queryRetreatBookingValidation),
  retreatBookingController.getAllRetreatBookingsAdmin,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(retreatBookingIdValidation),
  retreatBookingController.getSingleRetreatBookingAdmin,
);

export const retreatBookingRoutes = router;
