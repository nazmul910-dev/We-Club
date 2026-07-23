import { Router } from 'express';

import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';



import validateRequest from '../../utility/validateRequest';

import { courseModuleController } from './course.module.controller';

import {
  courseModuleIdValidation,
  courseModulePillarValidation,
  createCourseModuleValidation,
  updateCourseModuleValidation,
} from './course.module.validation';
import requireInvictusAccess from '../../middleware/invictusAccessMiddleware';

const router = Router();

router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  validateRequest(
    createCourseModuleValidation
  ),
  courseModuleController
    .createCourseModule
);

router.get(
  '/',
  verifyToken,
  requireInvictusAccess,
  courseModuleController
    .getAllCourseModules
);

router.get(
  '/pillar/:pillarId',
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    courseModulePillarValidation
  ),
  courseModuleController
    .getModulesByPillar
);

router.get(
  '/:id',
  verifyToken,
  requireInvictusAccess,
  validateRequest(
    courseModuleIdValidation
  ),
  courseModuleController
    .getSingleCourseModule
);

router.patch(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  validateRequest(
    updateCourseModuleValidation
  ),
  courseModuleController
    .updateCourseModule
);

router.patch(
  '/:id/publish',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  validateRequest(
    courseModuleIdValidation
  ),
  courseModuleController
    .publishCourseModule
);

router.patch(
  '/:id/draft',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  validateRequest(
    courseModuleIdValidation
  ),
  courseModuleController
    .moveCourseModuleToDraft
);

router.patch(
  '/:id/archive',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  validateRequest(
    courseModuleIdValidation
  ),
  courseModuleController
    .archiveCourseModule
);

export const courseModuleRoutes =
  router;