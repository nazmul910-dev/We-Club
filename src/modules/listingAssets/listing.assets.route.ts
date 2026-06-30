import { Router } from 'express';
import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';
import { listingAssetsController } from './listing.assets.controller';

const router = Router();

router.use(verifyToken);

router.get(
  '/admin/download-logs',
  authorizeRoles('admin', 'manager'),
  listingAssetsController.getAllListingAssetLogs
);

router.post(
  '/:listingId/download',
  listingAssetsController.downloadListingAssets
);

router.get(
  '/:listingId/download-logs',
  listingAssetsController.getListingAssetLogs
);

export const listingAssetsRoutes = router;