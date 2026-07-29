import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { videoProgressController } from "./video.progress.controller";

import {
  getAllVideoProgressValidation,
  recordVideoHeartbeatValidation,
  videoProgressModuleIdValidation,
  videoProgressVideoIdValidation,
} from "./video.progress.validation";

const router = Router();

/**
 * User sends watched segments while
 * the video is playing.
 */
router.patch(
  "/video/:videoId/heartbeat",

  verifyToken,

  requireInvictusAccess,

  validateRequest(recordVideoHeartbeatValidation),

  videoProgressController.recordVideoHeartbeat,
);

/**
 * Current user's progress for one video.
 */
router.get(
  "/video/:videoId/me",

  verifyToken,

  requireInvictusAccess,

  validateRequest(videoProgressVideoIdValidation),

  videoProgressController.getMyVideoProgress,
);

/**
 * Current user's video progress summary
 * for one CourseModule.
 */
router.get(
  "/module/:moduleId/me",

  verifyToken,

  requireInvictusAccess,

  validateRequest(videoProgressModuleIdValidation),

  videoProgressController.getMyModuleVideoProgress,
);

/**
 * Current user's complete video
 * progress history.
 */
router.get(
  "/me",

  verifyToken,

  requireInvictusAccess,

  videoProgressController.getMyAllVideoProgress,
);

/**
 * Admin/Manager progress report.
 */
router.get(
  "/",

  verifyToken,

  authorizeRoles("admin", "manager"),

  validateRequest(getAllVideoProgressValidation),

  videoProgressController.getAllVideoProgress,
);

export const videoProgressRoutes = router;
