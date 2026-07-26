import { Router } from "express";
import { verifyToken } from "../../middleware/authMiddleware";
import { getMessageHistoryHandler } from "./message.controller";

const router = Router();

router.get("/:roomId", verifyToken, getMessageHistoryHandler);
router.get("/", (req, res) => {
  res.send("room route is working as expected");
});

export default router;
