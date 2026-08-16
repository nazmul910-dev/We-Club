import { Types } from "mongoose";

export const CERTIFICATE_STATUSES = ["issued", "revoked"] as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export interface IQuizCertificate {
  user: Types.ObjectId;
  module: Types.ObjectId;
  pillar: Types.ObjectId;

  quizAttempt?: Types.ObjectId | undefined;

  certificateNumber: string;

  status: CertificateStatus;

  score: number;

  issuedAt: Date;

  certificateUrl?: string | undefined;

  revokedAt?: Date | undefined;
  revokedReason?: string | undefined;
  revokedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IIssueQuizCertificate {
  moduleId: string;
}

export interface IRevokeQuizCertificate {
  reason?: string | undefined;
}

export interface IAttachCertificateUrl {
  certificateUrl: string;
}
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
  "/module/:moduleId/issue",

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

  authorizeRoles("founder", "manager"),

  validateRequest(getAllCertificatesValidation),

  quizCertificateController.getAllCertificatesAdmin,
);

router.get(
  "/:id",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(adminCertificateIdValidation),

  quizCertificateController.getSingleCertificateAdmin,
);

router.patch(
  "/:id/attach-url",

  verifyToken,

  authorizeRoles("founder", "manager"),

  validateRequest(attachCertificateUrlValidation),

  quizCertificateController.attachCertificateUrl,
);

router.patch(
  "/:id/revoke",

  verifyToken,

  authorizeRoles("admin", "manager"),

  validateRequest(revokeCertificateValidation),

  quizCertificateController.revokeCertificate,
);

export const quizCertificateRoutes = router;

export interface IQuizCertificateAdminQuery {
  userId?: string | undefined;
  moduleId?: string | undefined;
  pillarId?: string | undefined;
  status?: CertificateStatus | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}
