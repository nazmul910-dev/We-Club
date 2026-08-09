import { Router } from 'express';
import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';
import { discountController } from './discount.controller';

const router = Router();

router.get('/validate', discountController.validateDiscountCode);

router.use(verifyToken);
router.use(authorizeRoles('founder', 'manager'));

router.post('/', discountController.createDiscountCode);

router.get('/', discountController.getAllDiscountCodes);

router.post('/send-email', discountController.sendDiscountCodeEmail);
router.delete('/:id', discountController.deleteDiscountCode);

export const discountRoutes = router;