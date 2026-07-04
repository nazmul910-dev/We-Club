import { Router } from 'express';
import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';
import { adminController } from './admin.controller';

const router = Router();

/**
 * @openapi
 * /admin/users/{id}/approval-status:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve or reject a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApprovalStatusRequest'
 *     responses:
 *       200:
 *         description: Approval status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Forbidden — requires admin/manager role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.patch(
  '/users/:id/approval-status',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  adminController.updateUserApprovalStatus
);

/**
 * @openapi
 * /admin/users/{id}/license-verification-status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a user's real-estate license verification status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LicenseVerificationStatusRequest'
 *     responses:
 *       200:
 *         description: License verification status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Forbidden — requires admin/manager role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.patch(
  '/users/:id/license-verification-status',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  adminController.updateUserLicenseVerificationStatus
);



/**
 * @openapi
 * /admin/users/{id}/account-status:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate, suspend, or otherwise change a user's account status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountStatusRequest'
 *     responses:
 *       200:
 *         description: Account status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Forbidden — requires admin/manager role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/users/:id/account-status',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  adminController.updateUserAccountStatus
);

export const adminRoutes = router;