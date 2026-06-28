import { Router } from 'express';
import { listingController } from './listings.controllers';
import { verifyToken } from '../../middleware/authMiddleware';


const router = Router();


router.get("/",  listingController.getAllListing);
router.post("/",  listingController.createListing);
router.get("/my", verifyToken, listingController.getMyListings);

router.put("/:id", verifyToken, listingController.updateListing);
router.get("/:id",  listingController.getListingById);
router.delete("/:id", verifyToken,  listingController.deleteListing);



export const listingsRoutes = router