import { Router } from "express";
import { upload } from "../../middleware/uploadMiddleware";
import { logoController } from "./logo.controller";
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", logoController.getLogo);


router.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager"),
  upload.single("logo"),
  logoController.logoUpload
);

router.patch(
  "/change",
  verifyToken,
  authorizeRoles("founder", "manager"),
  upload.single("logo"),
  logoController.changeLogo
);

export const LogoRoutes = router;