import { Router } from "express";
import { verifyToken } from "../../middleware/authMiddleware";
import {
	getCountryRoomHandler,
	getGeneralRoomHandler,
} from "./room.controller";

const router = Router();

router.get("/general", verifyToken, getGeneralRoomHandler);
router.get("/country", verifyToken, getCountryRoomHandler);

export default router;
