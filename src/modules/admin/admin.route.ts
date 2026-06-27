import { Router } from 'express';
import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';
import { adminController } from './admin.controller';

const router = Router();

router.patch(
  '/users/:id/approval-status',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  adminController.updateUserApprovalStatus
);

router.patch(
  '/users/:id/license-verification-status',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  adminController.updateUserLicenseVerificationStatus
);

router.patch(
  '/users/:id/account-status',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  adminController.updateUserAccountStatus
);

export const adminRoutes = router;