import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { quizAttemptController } from "./quiz.attempt.controller";

import {
  adminQuizAttemptIdValidation,
  getAllQuizAttemptsValidation,
  quizAttemptIdValidation,
  quizAttemptModuleValidation,
  submitQuizAttemptValidation,
} from "./quiz.attempt.validation";

const router = Router();

/**
 * User submits quiz answers.
 */
router.post(
  "/module/:moduleId/submit",

  verifyToken,

  requireInvictusAccess,

  validateRequest(submitQuizAttemptValidation),

  quizAttemptController.submitQuizAttempt,
);

/**
 * User gets all attempts for one module.
 */
router.get(
  "/me/module/:moduleId",

  verifyToken,

  requireInvictusAccess,

  validateRequest(quizAttemptModuleValidation),

  quizAttemptController.getMyModuleAttempts,
);

/**
 * User gets own single attempt.
 */
router.get(
  "/me/:attemptId",

  verifyToken,

  requireInvictusAccess,

  validateRequest(quizAttemptIdValidation),

  quizAttemptController.getMySingleAttempt,
);

/**
 * Admin/Manager gets all attempts.
 */
router.get(
  "/",

  verifyToken,

  authorizeRoles("admin", "manager"),

  validateRequest(getAllQuizAttemptsValidation),

  quizAttemptController.getAllQuizAttempts,
);

/**
 * Admin/Manager gets one attempt,
 * including configured correct answers.
 */
router.get(
  "/:id",

  verifyToken,

  authorizeRoles("admin", "manager"),

  validateRequest(adminQuizAttemptIdValidation),

  quizAttemptController.getSingleAttemptAdmin,
);

export const quizAttemptRoutes = router;
