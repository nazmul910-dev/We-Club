import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";


import {
  cancelMentorBookingValidation,
  completeMentorBookingValidation,
  confirmMentorBookingValidation,
  createMentorBookingValidation,
  mentorBookingIdValidation,
  noShowMentorBookingValidation,
  queryMentorBookingValidation,
  updateMentorBookingValidation,
} from "./mentor.booking.validation";
import { mentorBookingController } from "./mentor.booking.controller";

const router = Router();

// Member Routes
router.post(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest(createMentorBookingValidation),
  mentorBookingController.createBooking,
);

router.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest(queryMentorBookingValidation),
  mentorBookingController.getMyMemberBookings,
);

router.get(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(mentorBookingIdValidation),
  mentorBookingController.getMyMemberSingleBooking,
);

router.patch(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(updateMentorBookingValidation),
  mentorBookingController.updateBooking,
);

router.patch(
  "/me/:id/cancel",
  verifyToken,
  requireInvictusAccess,
  validateRequest(cancelMentorBookingValidation),
  mentorBookingController.cancelBooking,
);


router.get(
  "/mentor/me",
  verifyToken,
  validateRequest(queryMentorBookingValidation),
  mentorBookingController.getMyMentorBookings,
);

router.get(
  "/mentor/me/:id",
  verifyToken,
  validateRequest(mentorBookingIdValidation),
  mentorBookingController.getMyMentorSingleBooking,
);

// Shared Mentor/Admin Action Routes
router.patch(
  "/:id/confirm",
  verifyToken,
  validateRequest(confirmMentorBookingValidation),
  mentorBookingController.confirmBooking,
);

router.patch(
  "/:id/complete",
  verifyToken,
  validateRequest(completeMentorBookingValidation),
  mentorBookingController.completeBooking,
);

router.patch(
  "/:id/no-show",
  verifyToken,
  validateRequest(noShowMentorBookingValidation),
  mentorBookingController.markNoShowBooking,
);

router.patch(
  "/:id/cancel",
  verifyToken,
  validateRequest(cancelMentorBookingValidation),
  mentorBookingController.cancelBooking,
);

// Admin Routes
router.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(queryMentorBookingValidation),
  mentorBookingController.getAllBookingsAdmin,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(mentorBookingIdValidation),
  mentorBookingController.getSingleBookingAdmin,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(updateMentorBookingValidation),
  mentorBookingController.updateBooking,
);

export const mentorBookingRoutes = router;
