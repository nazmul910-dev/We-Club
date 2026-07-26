import { Router } from "express";

import {
  authorizeRoles,
  verifyToken,
} from "../../middleware/authMiddleware";
import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";
import {
  normalizeModuleVideoMultipartBody,
  uploadModuleVideo,
} from "../../middleware/mediaUploadMiddleware";
import validateRequest from "../../utility/validateRequest";
import { moduleVideoController } from "./module.video.controller";
import {
  createModuleVideoValidation,
  moduleVideoIdValidation,
  moduleVideoModuleValidation,
  updateModuleVideoValidation,
} from "./module.video.validation";

const router = Router();

router.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles("admin", "manager"),
  uploadModuleVideo.single("video"),
  normalizeModuleVideoMultipartBody,
  validateRequest(createModuleVideoValidation),
  moduleVideoController.createModuleVideo
);

router.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  moduleVideoController.getAllModuleVideos
);

router.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest(moduleVideoModuleValidation),
  moduleVideoController.getVideosByModule
);

router.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(moduleVideoIdValidation),
  moduleVideoController.getSingleModuleVideo
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(updateModuleVideoValidation),
  moduleVideoController.updateModuleVideo
);

router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(moduleVideoIdValidation),
  moduleVideoController.publishModuleVideo
);

router.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(moduleVideoIdValidation),
  moduleVideoController.moveModuleVideoToDraft
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest(moduleVideoIdValidation),
  moduleVideoController.archiveModuleVideo
);

export const moduleVideoRoutes = router;
