import { Router } from 'express';
import { listingController } from './listings.controllers';
import { verifyToken } from '../../middleware/authMiddleware';


const router = Router();


router.get("/",  listingController.getAllListing);
router.post("/",  listingController.createListing);
router.get("/my", verifyToken, listingController.getMyListings)



export const listingsRoutes = router