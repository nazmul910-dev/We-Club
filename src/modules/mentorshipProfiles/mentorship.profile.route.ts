import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import validateRequest from "../../utility/validateRequest";

import { mentorshipProfileController } from "./mentorship.profile.controller";

import {
  createMentorValidation,
  createMentorshipProfileValidation,
  mentorshipProfileIdValidation,
  selectCoMentorValidation,
  updateAvailabilityValidation,
  updateMentorshipProfileValidation,
} from "./mentorship.profile.validation";

const router = Router();


router.get("/", mentorshipProfileController.getAllMentorshipProfiles);

router.get("/primary", mentorshipProfileController.getPrimaryMentor);

router.get(
  "/management",
  verifyToken,
  authorizeRoles("founder", "manager"),
  mentorshipProfileController.getAllMentorshipProfiles,
);

// Member co_mentor selection — must be declared before "/:id" routes
router.get(
  "/me/co_mentor",
  verifyToken,
  mentorshipProfileController.getMyCoMentor,
);

router.patch(
  "/me/co_mentor",
  verifyToken,
  validateRequest(selectCoMentorValidation),
  mentorshipProfileController.selectCoMentor,
);

router.get(
  "/me/availability",
  verifyToken,
  mentorshipProfileController.getMyPrimaryMentorAvailability,
);

router.patch(
  "/me/availability",
  verifyToken,
  validateRequest(updateAvailabilityValidation),
  mentorshipProfileController.updateMyPrimaryMentorAvailability,
);

router.get(
  "/:id",

  validateRequest(mentorshipProfileIdValidation),

  mentorshipProfileController.getSingleMentorshipProfile,
);

router.post(
  "/",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(createMentorshipProfileValidation),

  mentorshipProfileController.createMentorshipProfile,
);

router.post(
  "/create-mentor",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest(createMentorValidation),
  mentorshipProfileController.createMentor,
);

router.patch(
  "/:id",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(updateMentorshipProfileValidation),

  mentorshipProfileController.updateMentorshipProfile,
);

router.patch(
  "/:id/publish",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(mentorshipProfileIdValidation),

  mentorshipProfileController.publishMentorshipProfile,
);

router.patch(
  "/:id/draft",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(mentorshipProfileIdValidation),

  mentorshipProfileController.moveMentorshipProfileToDraft,
);

router.patch(
  "/:id/archive",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(mentorshipProfileIdValidation),

  mentorshipProfileController.archiveMentorshipProfile,
);

export const mentorshipProfileRoutes = router;