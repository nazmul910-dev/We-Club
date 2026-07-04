import { Router } from 'express';
import {
  authorizeRoles,
  verifyToken,
} from '../../middleware/authMiddleware';
import { listingAssetsController } from './listing.assets.controller';

const router = Router();

router.use(verifyToken);

/**
 * @openapi
 * /listing-assets/admin/download-logs:
 *   get:
 *     tags: [Listing Assets]
 *     summary: Get all listing-asset download logs (admin/manager only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all download logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ListingAssetDownloadLog'
 *       403:
 *         description: Forbidden — requires admin/manager role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/admin/download-logs',
  authorizeRoles('admin', 'manager'),
  listingAssetsController.getAllListingAssetLogs
);


/**
 * @openapi
 * /listing-assets/{listingId}/download:
 *   post:
 *     tags: [Listing Assets]
 *     summary: Download a listing's images/one-pager as a ZIP package
 *     description: Generates a ZIP (using Archiver + PDFKit) and logs the download event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: ZIP file stream
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:listingId/download',
  listingAssetsController.downloadListingAssets
);

/**
 * @openapi
 * /listing-assets/{listingId}/download-logs:
 *   get:
 *     tags: [Listing Assets]
 *     summary: Get the download history for a specific listing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: List of download logs for this listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ListingAssetDownloadLog'
 */
router.get(
  '/:listingId/download-logs',
  listingAssetsController.getListingAssetLogs
);

export const listingAssetsRoutes = router;