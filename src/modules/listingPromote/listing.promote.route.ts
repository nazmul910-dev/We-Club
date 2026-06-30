import { Router } from "express";
import { listingPromoteRequestController } from "./listing.promote.controller";

import {verifyToken} from "../../middleware/authMiddleware";
const router = Router();

// can see all the promote request using this route
router.get("/all", listingPromoteRequestController.getAllListingPromoteRequest);

// can post a new promote request to a listing
router.post("/", verifyToken, listingPromoteRequestController.createListingPromoteRequest);



// an associate or who listed the listing can manage the promote request 
router.post("/manage/:id",  verifyToken, listingPromoteRequestController.manageListingPromoteRequest);

// can see how many promote requested reviced by a associate.
router.get ("/received", verifyToken,  listingPromoteRequestController.getMyListingsPromoteRequest)

// can get a user/promoter promote request to different listings
router.get ("/sent", verifyToken,  listingPromoteRequestController.getMyPromoteRequests);

// this route is created for only admin here one more middleware should needs to be added called verifyAdmin allthough i have implemented the logic but this needs to be reverted.
router.delete("/:id", verifyToken,   listingPromoteRequestController.deletePromoteRequest)

// by this api a person who created the promote request can update cencel the promote request. 
router.put("/:id", verifyToken,   listingPromoteRequestController.cencelPromoteRequest)

export const listingPromoteRequestRoutes = router;