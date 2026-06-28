import { Router } from "express";
import { listingPromoteRequestController } from "./listing.promote.controller";

import {verifyToken} from "../../middleware/authMiddleware";
const router = Router();

router.get("/", listingPromoteRequestController.getAllListingPromoteRequest);
router.post("/", listingPromoteRequestController.createListingPromoteRequest);
router.post("/manage-request/:id",  verifyToken, listingPromoteRequestController.manageListingPromoteRequest);
router.get ("/received", verifyToken,  listingPromoteRequestController.getMyListingsPromoteRequest)
router.get ("/sent", verifyToken,  listingPromoteRequestController.getMyPromoteRequests)

export const listingPromoteRequestRoutes = router;