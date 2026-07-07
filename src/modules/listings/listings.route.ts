import { Router } from 'express';
import { listingController } from './listings.controllers';
import { verifyToken } from '../../middleware/authMiddleware';
import { uploadListingImages } from '../../middleware/uploadMiddleware';


const router = Router();

/**
 * @openapi
 * /listings:
 *   get:
 *     tags: [Listings]
 *     summary: Get all listings
 *     security: []
 *     responses:
 *       200:
 *         description: List of all active listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 */
router.get("/",  listingController.getAllListing);

/**
 * @openapi
 * /listings:
 *   post:
 *     tags: [Listings]
 *     summary: Create a new listing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingRequest'
 *     responses:
 *       201:
 *         description: Listing created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Listing'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", verifyToken, uploadListingImages,  listingController.createListing);

/**
 * @openapi
 * /listings/my:
 *   get:
 *     tags: [Listings]
 *     summary: Get listings created by the logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the current user's listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 */
router.get("/my", verifyToken, listingController.getMyListings);
router.get("/my-promoters", verifyToken, listingController.getMyPromoters);


/**
 * @openapi
 * /listings/{id}:
 *   put:
 *     tags: [Listings]
 *     summary: Update a listing (fields and/or images)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingRequest'
 *     responses:
 *       200:
 *         description: Listing updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id",  verifyToken, uploadListingImages, listingController.updateListing);
router.patch("/cancel/:id", verifyToken, listingController.cancelPendingListing);
router.patch("/delete/:id", verifyToken, listingController.deletePendingListing);

/**
 * @openapi
 * /listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Get a single listing by ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Listing found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id",  listingController.getListingById);

/**
 * @openapi
 * /listings/{id}:
 *   delete:
 *     tags: [Listings]
 *     summary: Delete a listing (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Listing deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", verifyToken,  listingController.deleteListing);

export const listingsRoutes = router;
