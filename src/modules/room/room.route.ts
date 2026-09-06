import { Router } from "express";
import { verifyToken } from "../../middleware/authMiddleware";
import {
	getCountryRoomHandler,
	getGeneralRoomHandler,
	getPrivateRoomHandler,
	getPrivateRoomsHandler,
	invitePrivateRoomMemberHandler,
	getCountryRoomAccessHandler,
	requestCountryRoomHandler,
	getMyCountryRoomRequestsHandler,
	getCountryRoomRequestsForReviewHandler,
	reviewCountryRoomRequestHandler,
} from "./room.controller";
import { authorizeRoles } from "../../middleware/authMiddleware";

const router = Router();

router.get("/general", verifyToken, getGeneralRoomHandler);
router.get("/country", verifyToken, getCountryRoomHandler);
router.get("/country/access", verifyToken, getCountryRoomAccessHandler);
router.post("/country/requests", verifyToken, requestCountryRoomHandler);
router.get("/country/requests/me", verifyToken, getMyCountryRoomRequestsHandler);
router.get(
	"/country/requests",
	verifyToken,
	authorizeRoles("founder", "manager"),
	getCountryRoomRequestsForReviewHandler,
);
router.patch(
	"/country/requests/:id",
	verifyToken,
	authorizeRoles("founder", "manager"),
	reviewCountryRoomRequestHandler,
);
router.get("/private/:slug", verifyToken, getPrivateRoomHandler);
router.get("/private", verifyToken, getPrivateRoomsHandler);
router.post(
	"/private/:slug/invite/:userId",
	verifyToken,
	authorizeRoles("founder"),
	invitePrivateRoomMemberHandler,
);

export default router;
