import { Router } from "express";

import { authorizeRoles, verifyToken } from "../../middleware/authMiddleware";
import { requireInvictusAccess } from "../../middleware/invictusAccessMiddleware";

import validateRequest from "../../utility/validateRequest";

import { quizCertificateController } from "./quiz.certificate.controller";

import {
  adminCertificateIdValidation,
  attachCertificateUrlValidation,
  certificateIdValidation,
  getAllCertificatesValidation,
  issueCertificateValidation,
  revokeCertificateValidation,
  verifyCertificateValidation,
} from "./quiz.certificate.validation";

const router = Router();

router.get(
  "/verify/:certificateNumber",
  validateRequest(verifyCertificateValidation),
  quizCertificateController.verifyCertificate,
);

router.post(
  "/pillar/:pillarId/issue",
  verifyToken,
  requireInvictusAccess,
  validateRequest(issueCertificateValidation),
  quizCertificateController.issueMyCertificate,
);

router.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  quizCertificateController.getMyCertificates,
);

router.get(
  "/me/:certificateId",
  verifyToken,
  requireInvictusAccess,
  validateRequest(certificateIdValidation),
  quizCertificateController.getMySingleCertificate,
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(getAllCertificatesValidation),
  quizCertificateController.getAllCertificatesAdmin,
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(adminCertificateIdValidation),
  quizCertificateController.getSingleCertificateAdmin,
);

router.patch(
  "/:id/attach-url",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(attachCertificateUrlValidation),
  quizCertificateController.attachCertificateUrl,
);

router.patch(
  "/:id/revoke",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest(revokeCertificateValidation),
  quizCertificateController.revokeCertificate,
);

export const quizCertificateRoutes = router;
