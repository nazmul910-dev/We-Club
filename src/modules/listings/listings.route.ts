import { Router } from 'express';
import { listingController } from './listings.controllers';
import { verifyAdmin, verifyToken } from '../../middleware/authMiddleware';
import { uploadListingImages } from '../../middleware/uploadMiddleware';


const router = Router();


router.get("/",  listingController.getAllListing);
router.post("/", verifyToken, uploadListingImages,  listingController.createListing);
router.get("/my", verifyToken, listingController.getMyListings);
router.get("/my-promoters", verifyToken, listingController.getMyPromoters);

router.post("/manage/:id", verifyToken, verifyAdmin, listingController.manageListings)

router.put("/:id",  verifyToken, uploadListingImages, listingController.updateListing);
router.patch("/cancel/:id", verifyToken, listingController.cancelPendingListing);
router.patch("/delete/:id", verifyToken, listingController.deletePendingListing);
router.get("/:id",  listingController.getListingById);
router.delete("/:id", verifyToken,  listingController.deleteListing);

export const listingsRoutes = router;
