import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import validateRequest from "../../utility/validateRequest";
import { supportTicketController } from "./support.ticket.controller";
import { createSupportTicketValidation, supportTicketIdValidation, supportTicketListValidation, updateSupportTicketValidation } from "./support.ticket.validation";

const router = Router();
const ADMIN_ROLES = ["founder", "super_admin", "admin", "manager"] as const;

router.get("/", (req, res, next) => {
  res.status(200).json({ message: "Support ticket creation endpoint" });
});

router.post("/", verifyToken, validateRequest(createSupportTicketValidation), supportTicketController.create);
router.get("/me", verifyToken, validateRequest(supportTicketListValidation), supportTicketController.mine);
router.get("/admin", verifyToken, authorizeRoles(...ADMIN_ROLES), validateRequest(supportTicketListValidation), supportTicketController.adminList);
router.get("/:id", verifyToken, validateRequest(supportTicketIdValidation), supportTicketController.getById);
router.patch("/:id", verifyToken, authorizeRoles(...ADMIN_ROLES), validateRequest(updateSupportTicketValidation), supportTicketController.update);

export const supportTicketRoutes = router;
