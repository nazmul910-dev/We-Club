import { Router } from "express";

import {
  authorizeRoles,
  verifyToken,
} from "../../middleware/authMiddleware";
import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";
import {
  normalizeModuleResourceMultipartBody,
  uploadModuleResourceFields,
} from "../../middleware/mediaUploadMiddleware";
import validateRequest from "../../utility/validateRequest";
import { moduleResourceController } from "./module.resource.controller";
import {
  createModuleResourceValidation,
  moduleResourceIdValidation,
  moduleResourceModuleValidation,
  updateModuleResourceValidation,
} from "./module.resource.validation";

const router = Router();

router.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  uploadModuleResourceFields,
  normalizeModuleResourceMultipartBody,
  validateRequest(createModuleResourceValidation),
  moduleResourceController.createModuleResource
);

router.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  moduleResourceController.getAllModuleResources
);

router.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest(moduleResourceModuleValidation),
  moduleResourceController.getResourcesByModule
);

router.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest(moduleResourceIdValidation),
  moduleResourceController.getSingleModuleResource
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(updateModuleResourceValidation),
  moduleResourceController.updateModuleResource
);

router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(moduleResourceIdValidation),
  moduleResourceController.publishModuleResource
);

router.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(moduleResourceIdValidation),
  moduleResourceController.moveModuleResourceToDraft
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager","founder"),
  validateRequest(moduleResourceIdValidation),
  moduleResourceController.archiveModuleResource
);

export const moduleResourceRoutes = router;
