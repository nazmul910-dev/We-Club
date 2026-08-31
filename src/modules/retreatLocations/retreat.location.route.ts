import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";

import { retreatLocationController } from "./retreat.location.controller";
import {
  createRetreatLocationValidation,
  queryRetreatLocationValidation,
  retreatLocationIdValidation,
  updateRetreatLocationValidation,
} from "./retreat.location.validation";
import { uploadRetreatImages } from "../../middleware/uploadMiddleware";

const router = Router();

// Public / Member Routes (Location Overview & Details)
router.get(
  "/",
  validateRequest(queryRetreatLocationValidation),
  retreatLocationController.getAllRetreatLocations,
);

router.get(
  "/:idOrSlug",
  retreatLocationController.getSingleRetreatLocation,
);

// Admin / Manager Routes
router.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  uploadRetreatImages,
  validateRequest(createRetreatLocationValidation),
  retreatLocationController.createRetreatLocation,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  uploadRetreatImages,
  validateRequest(updateRetreatLocationValidation),
  retreatLocationController.updateRetreatLocation,
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(retreatLocationIdValidation),
  retreatLocationController.deleteRetreatLocation,
);

export const retreatLocationRoutes = router;
