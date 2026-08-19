import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { leaderboardEntryController } from "./leaderboard.entry.controller";

import {
  getLeaderboardEntriesValidation,
  leaderboardIdParamValidation,
  leaderboardUserParamValidation,
  upsertLeaderboardPointsValidation,
} from "./leaderboard.entry.validation";

const router = Router({ mergeParams: true });


router.post(
  "/:leaderboardId/entries",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(upsertLeaderboardPointsValidation),

  leaderboardEntryController.upsertPoints,
);


router.get(
  "/:leaderboardId/entries",

  verifyToken,

  requireInvictusAccess,

  validateRequest(getLeaderboardEntriesValidation),

  leaderboardEntryController.getLeaderboardEntries,
);


router.get(
  "/:leaderboardId/entries/me",

  verifyToken,

  requireInvictusAccess,

  validateRequest(leaderboardIdParamValidation),

  leaderboardEntryController.getMyEntry,
);

router.get(
  "/:leaderboardId/entries/:userId",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(leaderboardUserParamValidation),

  leaderboardEntryController.getSingleUserEntry,
);

router.delete(
  "/:leaderboardId/entries/:userId",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(leaderboardUserParamValidation),

  leaderboardEntryController.removeEntry,
);


router.post(
  "/:leaderboardId/recalculate",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(leaderboardIdParamValidation),

  leaderboardEntryController.recalculateRanks,
);

export const leaderboardEntryRoutes = router;
