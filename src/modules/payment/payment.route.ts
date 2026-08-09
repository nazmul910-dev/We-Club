import { Router } from 'express';
import { verifyToken,authorizeRoles, } from '../../middleware/authMiddleware';
import { paymentController } from './payment.controller';

const router = Router();

/**
 * @openapi
 * /payments/pricing:
 *   get:
 *     tags: [Payments]
 *     summary: Get pricing plans for all roles
 *     security: []
 *     responses:
 *       200:
 *         description: List of pricing plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RolePricingPlan'
 */
router.get('/pricing', paymentController.getAllPricingPlans);

/**
 * @openapi
 * /payments/pricing/{role}:
 *   get:
 *     tags: [Payments]
 *     summary: Get the pricing plan for a specific role
 *     security: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, manager, ceo, ceo_partner, associate, partner, ambassador, we_club_member]
 *         description: User role
 *     responses:
 *       200:
 *         description: Pricing plan for the given role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/RolePricingPlan'
 *       404:
 *         description: No pricing plan found for this role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/pricing/:role/:accessTo', paymentController.getPricingPlanByRoleAndAccess);

/**
 * @openapi
 * /payments/upgrade:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Stripe Checkout session to upgrade the logged-in user's role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpgradeCheckoutRequest'
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutSessionResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/upgrade',
  verifyToken,
  paymentController.createUpgradeCheckout
);

/**
 * @openapi
 * /payments/verify-session/{sessionId}:
 *   get:
 *     tags: [Payments]
 *     summary: Verify the payment status of a Stripe checkout session
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *         description: Stripe checkout session ID
 *     responses:
 *       200:
 *         description: Session status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, example: paid }
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/verify-session/:sessionId',
  paymentController.verifyCheckoutSession
);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Stripe webhook receiver
 *     description: >
 *       This endpoint is called by Stripe directly, not by API clients.
 *       It uses a raw request body (mounted in app.ts before express.json())
 *       so that Stripe's signature header can be verified.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid Stripe signature
 */
// Note: this route is actually registered directly in app.ts (before express.json())
// It is documented here for completeness.


router.get(
  '/registration-link/:token',

  paymentController
    .getRegistrationPaymentDetails
);

router.post(
  '/registration-link/:token/checkout',

  paymentController
    .createRegistrationCheckout
);

router.get(
  '/registration-pending',

  verifyToken,

  authorizeRoles(
    'founder'
  ),

  paymentController
    .getPendingRegistrationPayments
);

router.get(
  '/upgrade/plans',
  verifyToken,
  paymentController.getMyUpgradePlans
);


router.post(
  '/registration-link/:linkId/send',
  verifyToken,
  authorizeRoles('founder'),
  paymentController.sendRegistrationPaymentLink
);

export const paymentRoutes = router; 