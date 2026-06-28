import { Router } from 'express';
import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';
import { commissionLedgerController } from './commission.ledger.controller';

const router = Router();

router.use(verifyToken);

router.get(
  '/admin/all',
  authorizeRoles('admin', 'manager'),
  commissionLedgerController.getAllCommissions
);

router.patch(
  '/admin/:id/resolve-dispute',
  authorizeRoles('admin', 'manager'),
  commissionLedgerController.resolveCommissionDispute
);

router.get('/my', commissionLedgerController.getMyCommissions);

router.post(
  '/manual',
  authorizeRoles('associate', 'partner', 'admin', 'manager'),
  commissionLedgerController.createManualCommission
);

router.get('/:id', commissionLedgerController.getSingleCommission);

router.patch('/:id/confirm', commissionLedgerController.confirmCommission);

router.patch('/:id/mark-paid', commissionLedgerController.markCommissionPaid);

router.patch(
  '/:id/confirm-received',
  commissionLedgerController.confirmCommissionReceived
);

router.patch('/:id/dispute', commissionLedgerController.disputeCommission);

export const commissionLedgerRoutes = router;