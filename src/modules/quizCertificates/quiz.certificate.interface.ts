import { Types } from "mongoose";

export const CERTIFICATE_STATUSES = ["issued", "revoked"] as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export interface IQuizCertificate {
  user: Types.ObjectId;
  module?: Types.ObjectId | undefined;
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
  pillarId: string;
}

export interface IRevokeQuizCertificate {
  reason?: string | undefined;
}

export interface IAttachCertificateUrl {
  certificateUrl: string;
}

export interface IQuizCertificateAdminQuery {
  userId?: string | undefined;
  moduleId?: string | undefined;
  pillarId?: string | undefined;
  status?: CertificateStatus | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}
