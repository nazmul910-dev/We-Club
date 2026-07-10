import { Router } from "express";
import { dashboardController } from "./dashboard.analytics.controller";
import { verifyToken } from "../../middleware/authMiddleware";

const router = Router();

router.get("/stats", verifyToken,    dashboardController.getDashboardStats );
router.get(
    "/top-promoters",
    verifyToken,
    dashboardController.getTopPromoters
);

export const dashboardAnalyticsRoutes = router;