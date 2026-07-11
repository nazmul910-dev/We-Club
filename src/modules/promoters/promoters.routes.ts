import { Router } from "express";
import { Promoter } from "./promoters.model.schema";
import { promotersController } from "./promoters.controller";
import { verifyToken } from "../auth/auth.utils";


const router  = Router();

router.get("/",  promotersController.getPromoters);
router.patch("/:id/view",  promotersController.incrementPromoterView);


export  const promoterRoutes = router;