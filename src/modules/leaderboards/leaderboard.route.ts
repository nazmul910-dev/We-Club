import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { leaderboardController } from "./leaderboard.controller";

import {
  createLeaderboardValidation,
  getAllLeaderboardsValidation,
  leaderboardIdValidation,
  updateLeaderboardValidation,
} from "./leaderboard.validation";

const router = Router();


router.post(
  "/",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(createLeaderboardValidation),

  leaderboardController.createLeaderboard,
);


router.get(
  "/",

  verifyToken,

  requireInvictusAccess,

  validateRequest(getAllLeaderboardsValidation),

  leaderboardController.getAllLeaderboards,
);

router.get(
  "/:id",

  verifyToken,

  requireInvictusAccess,

  validateRequest(leaderboardIdValidation),

  leaderboardController.getSingleLeaderboard,
);

router.get(
     "/:id/entries",
     verifyToken,
     requireInvictusAccess,
     leaderboardController.getLeaderboardEntries,
   );

router.patch(
  "/:id",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(updateLeaderboardValidation),

  leaderboardController.updateLeaderboard,
);


router.post(
  "/:id/activate",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(leaderboardIdValidation),

  leaderboardController.activateLeaderboard,
);


router.post(
  "/:id/finalize",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(leaderboardIdValidation),

  leaderboardController.finalizeLeaderboard,
);

export const leaderboardRoutes = router;
