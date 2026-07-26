import { Router } from "express";
import { verifyToken } from "../../middleware/authMiddleware";
import { getGeneralRoomHandler } from "./room.controller";

const router = Router();

router.get("/general", verifyToken, getGeneralRoomHandler);

export default router;
