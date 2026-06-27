import { NextFunction, Request, Response, Router } from "express";
import { userController } from "./user.controller";
import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", userController.getAllUsers);  //verifyToken, authorizeRoles("ADMIN", "MANAGER" ),
router.get("/:id", userController.getSingleUser);

export const userRoutes = router;

// export default router;