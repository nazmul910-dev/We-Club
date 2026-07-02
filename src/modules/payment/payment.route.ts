import { Router } from 'express';
import { verifyToken } from '../../middleware/authMiddleware';
import { paymentController } from './payment.controller';

const router = Router();

router.get('/pricing', paymentController.getAllPricingPlans);

router.get('/pricing/:role/:accessTo', paymentController.getPricingPlanByRoleAndAccess);

router.post(
  '/upgrade',
  verifyToken,
  paymentController.createUpgradeCheckout
);

router.get(
  '/verify-session/:sessionId',
  paymentController.verifyCheckoutSession
);

export const paymentRoutes = router; 