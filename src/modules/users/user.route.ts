import { NextFunction, Request, Response, Router } from "express";
import { userController } from "./user.controller";
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, authorizeRoles("ADMIN", "MANAGER" ), userController.getAllUsers);

export const userRoutes = router;

// export default router;