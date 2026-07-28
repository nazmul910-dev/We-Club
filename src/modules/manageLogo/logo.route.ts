import { Router } from "express";
import { upload } from "../../middleware/uploadMiddleware";
import { logoController } from "./logo.controller";
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

const router = Router();

// Public: anyone can fetch the current site logo
router.get("/", logoController.getLogo);

// Admin only: upload logo (auth checked before file is processed)
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  upload.single("logo"),
  logoController.logoUpload
);

// Admin only: change/replace the existing logo
router.patch(
  "/change",
  verifyToken,
  authorizeRoles("admin"),
  upload.single("logo"),
  logoController.changeLogo
);

export const LogoRoutes = router;