import { Router } from 'express';
import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';
import { commissionLedgerController } from './commission.ledger.controller';

const router = Router();

router.use(verifyToken);

/**
 * @openapi
 * /commission/admin/all:
 *   get:
 *     tags: [Commission Ledger]
 *     summary: Get all commission ledger entries (admin/manager only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all commission entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommissionLedger'
 *       403:
 *         description: Forbidden — requires admin/manager role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/admin/all',
  authorizeRoles('admin', 'manager'),
  commissionLedgerController.getAllCommissions
);

/**
 * @openapi
 * /commission/admin/{id}/resolve-dispute:
 *   patch:
 *     tags: [Commission Ledger]
 *     summary: Resolve a disputed commission (admin/manager only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Commission ledger entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResolveDisputeRequest'
 *     responses:
 *       200:
 *         description: Dispute resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/CommissionLedger'
 *       403:
 *         description: Forbidden — requires admin/manager role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/admin/:id/resolve-dispute',
  authorizeRoles('admin', 'manager'),
  commissionLedgerController.resolveCommissionDispute
);

/**
 * @openapi
 * /commission/my:
 *   get:
 *     tags: [Commission Ledger]
 *     summary: Get commission entries belonging to the logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's commission entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommissionLedger'
 */
router.get('/my', commissionLedgerController.getMyCommissions);

/**
 * @openapi
 * /commission/manual:
 *   post:
 *     tags: [Commission Ledger]
 *     summary: Manually create a commission ledger entry
 *     description: Restricted to associate, partner, admin, and manager roles.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateManualCommissionRequest'
 *     responses:
 *       201:
 *         description: Commission entry created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/CommissionLedger'
 *       403:
 *         description: Forbidden — role not permitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/manual',
  authorizeRoles('associate', 'partner', 'admin', 'manager'),
  commissionLedgerController.createManualCommission
);

/**
 * @openapi
 * /commission/{id}:
 *   get:
 *     tags: [Commission Ledger]
 *     summary: Get a single commission ledger entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Commission ledger entry ID
 *     responses:
 *       200:
 *         description: Commission entry found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/CommissionLedger'
 *       404:
 *         description: Commission entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', commissionLedgerController.getSingleCommission);

/**
 * @openapi
 * /commission/{id}/confirm:
 *   patch:
 *     tags: [Commission Ledger]
 *     summary: Confirm a pending commission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Commission ledger entry ID
 *     responses:
 *       200:
 *         description: Commission confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/CommissionLedger'
 */
router.patch('/:id/confirm', commissionLedgerController.confirmCommission);


/**
 * @openapi
 * /commission/{id}/mark-paid:
 *   patch:
 *     tags: [Commission Ledger]
 *     summary: Mark a commission as paid
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Commission ledger entry ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkPaidRequest'
 *     responses:
 *       200:
 *         description: Commission marked as paid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/CommissionLedger'
 */
router.patch('/:id/mark-paid', commissionLedgerController.markCommissionPaid);

/**
 * @openapi
 * /commission/{id}/confirm-received:
 *   patch:
 *     tags: [Commission Ledger]
 *     summary: Recipient confirms they received the commission payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Commission ledger entry ID
 *     responses:
 *       200:
 *         description: Receipt confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/CommissionLedger'
 */
router.patch(
  '/:id/confirm-received',
  commissionLedgerController.confirmCommissionReceived
);

/**
 * @openapi
 * /commission/{id}/dispute:
 *   patch:
 *     tags: [Commission Ledger]
 *     summary: Open a dispute on a commission entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Commission ledger entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisputeRequest'
 *     responses:
 *       200:
 *         description: Dispute opened
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/CommissionLedger'
 */
router.patch('/:id/dispute', commissionLedgerController.disputeCommission);

router.patch(
  '/:id/send-payment',
  commissionLedgerController.sendCommissionPayment
);


router.patch(
  '/:id/confirm-received',
  commissionLedgerController.confirmCommissionReceived
);

export const commissionLedgerRoutes = router;