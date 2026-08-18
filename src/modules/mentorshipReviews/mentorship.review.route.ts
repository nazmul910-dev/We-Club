import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";
import validateRequest from "../../utility/validateRequest";

import { mentorshipReviewController } from "./mentorship.review.controller";
import {
  createMentorshipReviewValidation,
  mentorIdParamValidation,
  mentorshipReviewIdValidation,
  moderateMentorshipReviewValidation,
  updateMentorshipReviewValidation,
} from "./mentorship.review.validation";

const router = Router();


router.get(
  "/mentor/:mentorId",
  validateRequest(mentorIdParamValidation),
  mentorshipReviewController.getReviewsForMentor,
);


router.post(
  "/",
  verifyToken,
  requireInvictusAccess,
  validateRequest(createMentorshipReviewValidation),
  mentorshipReviewController.createReview,
);

router.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  mentorshipReviewController.getMyReviews,
);

router.patch(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(updateMentorshipReviewValidation),
  mentorshipReviewController.updateReview,
);

router.delete(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(mentorshipReviewIdValidation),
  mentorshipReviewController.deleteReview,
);


router.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  mentorshipReviewController.getAllReviewsAdmin,
);

router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(moderateMentorshipReviewValidation),
  mentorshipReviewController.moderateReview,
);

router.delete(
  "/:id/admin",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(mentorshipReviewIdValidation),
  mentorshipReviewController.deleteReviewAdmin,
);


router.get(
  "/:id",
  validateRequest(mentorshipReviewIdValidation),
  mentorshipReviewController.getSingleReview,
);

export const mentorshipReviewRoutes = router;
