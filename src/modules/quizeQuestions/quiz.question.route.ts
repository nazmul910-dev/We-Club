import { Router } from "express";

import {
  authorizeRoles,
  verifyToken,
} from "../../middleware/authMiddleware";

import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { quizQuestionController } from "./quiz.question.controller";

import {
  createQuizQuestionValidation,
  quizQuestionIdValidation,
  quizQuestionModuleValidation,
  updateQuizQuestionValidation,
} from "./quiz.question.validation";

const router = Router();

router.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    createQuizQuestionValidation
  ),
  quizQuestionController
    .createQuizQuestion
);

router.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  quizQuestionController
    .getAllQuizQuestions
);

router.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    quizQuestionModuleValidation
  ),
  quizQuestionController
    .getQuestionsByModule
);

router.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    quizQuestionIdValidation
  ),
  quizQuestionController
    .getSingleQuizQuestion
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    updateQuizQuestionValidation
  ),
  quizQuestionController
    .updateQuizQuestion
);

router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    quizQuestionIdValidation
  ),
  quizQuestionController
    .publishQuizQuestion
);

router.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    quizQuestionIdValidation
  ),
  quizQuestionController
    .moveQuizQuestionToDraft
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager",
    "founder"
  ),
  validateRequest(
    quizQuestionIdValidation
  ),
  quizQuestionController
    .archiveQuizQuestion
);

export const quizQuestionRoutes =
  router;