import { Router } from "express";

import { verifyToken } from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";
import { userDeviceController } from "./user.device.controller";
import { registerUserDeviceValidation, userDeviceIdValidation } from "./user.device.validation";

const router = Router();

router.post("/me", verifyToken, validateRequest(registerUserDeviceValidation), userDeviceController.register);
router.get("/me", verifyToken, userDeviceController.list);
router.patch("/me/:id/revoke", verifyToken, validateRequest(userDeviceIdValidation), userDeviceController.revoke);

export const userDeviceRoutes = router;
