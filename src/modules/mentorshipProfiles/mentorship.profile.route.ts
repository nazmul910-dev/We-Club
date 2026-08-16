import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import validateRequest from "../../utility/validateRequest";

import { mentorshipProfileController } from "./mentorship.profile.controller";

import {
  createMentorshipProfileValidation,
  mentorshipProfileIdValidation,
  updateMentorshipProfileValidation,
} from "./mentorship.profile.validation";

const router = Router();


router.get("/", mentorshipProfileController.getAllMentorshipProfiles);

router.get("/primary", mentorshipProfileController.getPrimaryMentor);

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
