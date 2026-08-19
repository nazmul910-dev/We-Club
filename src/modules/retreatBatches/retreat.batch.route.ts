import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";

import { retreatBatchController } from "./retreat.batch.controller";
import {
  createRetreatBatchValidation,
  queryRetreatBatchValidation,
  retreatBatchIdValidation,
  updateRetreatBatchValidation,
} from "./retreat.batch.validation";

const router = Router();

// Public / Member Routes (Batch List & Details)
router.get(
  "/",
  validateRequest(queryRetreatBatchValidation),
  retreatBatchController.getAllRetreatBatches,
);

router.get(
  "/:idOrSlug",
  retreatBatchController.getSingleRetreatBatch,
);

// Admin / Manager Routes
router.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(createRetreatBatchValidation),
  retreatBatchController.createRetreatBatch,
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(updateRetreatBatchValidation),
  retreatBatchController.updateRetreatBatch,
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest(retreatBatchIdValidation),
  retreatBatchController.deleteRetreatBatch,
);

export const retreatBatchRoutes = router;
