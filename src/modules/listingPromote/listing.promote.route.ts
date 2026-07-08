import { Router } from "express";
import { listingPromoteRequestController } from "./listing.promote.controller";

import {verifyToken} from "../../middleware/authMiddleware";
const router = Router();

/**
 * @openapi
 * /listings/promote-request/all:
 *   get:
 *     tags: [Listing Promote Requests]
 *     summary: Get all promote requests
 *     security: []
 *     responses:
 *       200:
 *         description: List of all promote requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromoteRequest'
 */
router.get("/all", listingPromoteRequestController.getAllListingPromoteRequest);

/**
 * @openapi
 * /listings/promote-request:
 *   post:
 *     tags: [Listing Promote Requests]
 *     summary: Create a new promote request for a listing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePromoteRequest'
 *     responses:
 *       201:
 *         description: Promote request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PromoteRequest'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", verifyToken, listingPromoteRequestController.createListingPromoteRequest);

/**
 * @openapi
 * /listings/promote-request/manage/{id}:
 *   post:
 *     tags: [Listing Promote Requests]
 *     summary: Approve or reject a promote request (listing owner action)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Promote request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManagePromoteRequest'
 *     responses:
 *       200:
 *         description: Promote request updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PromoteRequest'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/manage/:id",  verifyToken, listingPromoteRequestController.manageListingPromoteRequest);

/**
 * @openapi
 * /listings/promote-request/received:
 *   get:
 *     tags: [Listing Promote Requests]
 *     summary: Get promote requests received on the logged-in user's own listings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of received promote requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromoteRequest'
 */
router.get ("/received", verifyToken,  listingPromoteRequestController.getMyListingsPromoteRequest)

/**
 * @openapi
 * /listings/promote-request/sent:
 *   get:
 *     tags: [Listing Promote Requests]
 *     summary: Get promote requests sent by the logged-in user (as a promoter)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sent promote requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromoteRequest'
 */
router.get ("/sent", verifyToken,  listingPromoteRequestController.getMyPromoteRequests);

/**
 * @openapi
 * /listings/promote-request/{id}:
 *   delete:
 *     tags: [Listing Promote Requests]
 *     summary: Delete a promote request
 *     description: >
 *       Intended to be an admin-only action. Currently only protected by
 *       verifyToken in code (a dedicated admin-role check is planned).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Promote request ID
 *     responses:
 *       200:
 *         description: Promote request deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete("/:id", verifyToken,   listingPromoteRequestController.deletePromoteRequest)

/**
 * @openapi
 * /listings/promote-request/{id}:
 *   put:
 *     tags: [Listing Promote Requests]
 *     summary: Cancel a promote request (requester action)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Promote request ID
 *     responses:
 *       200:
 *         description: Promote request cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PromoteRequest'
 */ 
router.put("/:id", verifyToken,   listingPromoteRequestController.cencelPromoteRequest)

export const listingPromoteRequestRoutes = router;