import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import { uploadRetreatImages } from "../../middleware/uploadMiddleware";
import validateRequest from "../../utility/validateRequest";

import { retreatLocationController } from "./retreat.location.controller";
import {
  createRetreatLocationValidation,
  retreatLocationIdValidation,
  retreatLocationSlugValidation,
  updateRetreatLocationValidation,
} from "./retreat.location.validation";

const router = Router();


router.get("/", retreatLocationController.getAllRetreatLocations);

router.get("/featured", retreatLocationController.getFeaturedRetreatLocations);

router.get(
  "/slug/:slug",
  validateRequest(retreatLocationSlugValidation),
  retreatLocationController.getSingleRetreatLocationBySlug,
);


router.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  uploadRetreatImages,
  validateRequest(createRetreatLocationValidation),
  retreatLocationController.createRetreatLocation,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  uploadRetreatImages,
  validateRequest(updateRetreatLocationValidation),
  retreatLocationController.updateRetreatLocation,
);

router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(retreatLocationIdValidation),
  retreatLocationController.publishRetreatLocation,
);

router.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(retreatLocationIdValidation),
  retreatLocationController.moveRetreatLocationToDraft,
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(retreatLocationIdValidation),
  retreatLocationController.archiveRetreatLocation,
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest(retreatLocationIdValidation),
  retreatLocationController.deleteRetreatLocation,
);


router.get(
  "/:id",
  validateRequest(retreatLocationIdValidation),
  retreatLocationController.getSingleRetreatLocationById,
);

export const retreatLocationRoutes = router;
