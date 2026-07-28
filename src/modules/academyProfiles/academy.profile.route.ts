import { Router } from "express";

import { verifyToken, authorizeRoles } from "../../middleware/authMiddleware";

import { academyProfileController } from "./academy.profile.controller";

const router = Router();

router.post("/", verifyToken, academyProfileController.createProfile);

router.get("/me", verifyToken, academyProfileController.getMyProfile);

router.patch("/me", verifyToken, academyProfileController.updateProfile);

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  academyProfileController.getAllProfiles,
);

export const academyProfileRoutes = router;
