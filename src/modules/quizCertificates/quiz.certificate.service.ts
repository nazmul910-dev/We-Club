import { QueryFilter, Types } from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";
import { ModuleProgress } from "../moduleProgress/module.progress.model.schema";
import { notificationService } from "../notifications/notification.service";

import {
  IAttachCertificateUrl,
  IQuizCertificate,
  IQuizCertificateAdminQuery,
} from "./quiz.certificate.interface";

import { QuizCertificate } from "./quiz.certificate.model.schema";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
};

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const isAdminOrManager = (role?: string | undefined): boolean => {
  return role === "admin" || role === "manager";
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const CERTIFICATE_POPULATE = [
  {
    path: "user",
    select: "fullName email role profileImage",
  },
  {
    path: "module",
    select: "title slug moduleNumber pillar status",

    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title status",
    },
  },
  {
    path: "pillar",
    select: "name slug title status",
  },
  {
    path: "revokedBy",
    select: "fullName email role",
  },
];

const randomAlphaNumeric = (length: number): string => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length),
    );
  }

  return result;
};

const buildCertificateNumber = (pillarSlug: string): string => {
  return ["INV", pillarSlug.toUpperCase(), randomAlphaNumeric(6)].join("-");
};

/**
 * Issue a pillar certificate when the user has passed the quiz
 * for EVERY published module in the given pillar.
 */
const issueCertificateIfEligible = async (
  userId: string,
  pillarId: string,
) => {
  assertValidObjectId(userId, "User ID");
  assertValidObjectId(pillarId, "Pillar ID");

  // 1. Already has a certificate for this pillar?
  const existingCertificate = await QuizCertificate.findOne({
    user: new Types.ObjectId(userId),
    pillar: new Types.ObjectId(pillarId),
  }).populate(CERTIFICATE_POPULATE);

  if (existingCertificate) {
    return existingCertificate;
  }

  // 2. Find all published modules for this pillar
  const pillarModules = await CourseModule.find({
    pillar: new Types.ObjectId(pillarId),
    status: "published",
  })
    .select("_id title moduleNumber")
    .lean();

  if (pillarModules.length === 0) {
    throwServiceError(
      "No published modules found for this pillar",
      404,
    );
  }

  const moduleIds = pillarModules.map((m) => m._id);

  // 3. Fetch user progress for all those modules
  const progressDocs = await ModuleProgress.find({
    user: new Types.ObjectId(userId),
    module: { $in: moduleIds },
  })
    .select("module quizSummary")
    .lean();

  // 4. Check that EVERY module has been passed
  const progressByModuleId: Record<string, typeof progressDocs[number]> = {};
  for (const p of progressDocs) {
    progressByModuleId[String(p.module)] = p;
  }

  for (const mod of pillarModules) {
    const progress = progressByModuleId[String(mod._id)];
    if (!progress || !progress.quizSummary?.passed) {
      throwServiceError(
        `You must pass the quiz for every module in this pillar before claiming the certificate. Module "${mod.title}" is not yet passed.`,
        403,
      );
    }
  }

  // 5. Compute average best score across all modules
  const totalScore = progressDocs.reduce(
    (sum, p) => sum + (p.quizSummary?.bestScore ?? 0),
    0,
  );
  const averageScore = Math.round(totalScore / pillarModules.length);

  // 6. Resolve pillar slug for certificate number
  const { ChallengePillar } = await import(
    "../challengePillars/challenge.pillar.model.schema"
  );
  const pillarDoc = await ChallengePillar.findById(pillarId)
    .select("slug")
    .lean();

  assertFound(pillarDoc, "Challenge pillar not found", 404);

  const createData = {
    user: new Types.ObjectId(userId),
    pillar: new Types.ObjectId(pillarId),
    status: "issued" as const,
    score: averageScore,
    issuedAt: new Date(),
  };

  // 7. Issue with duplicate-safe retry loop (handles race conditions)
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const certificate = await QuizCertificate.create({
        ...createData,
        certificateNumber: buildCertificateNumber(pillarDoc.slug),
      });

      notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "quiz_certificate_issued",
        fallbackTitle: `Certificate Earned: ${pillarDoc.title || pillarDoc.slug.toUpperCase()}`,
        fallbackBody: `Congratulations! You have completed all modules and earned your official certificate.`,
        recipient: userId,
        relatedEntityType: "QuizCertificate",
        relatedEntityId: String(certificate._id),
        actionUrl: `/invictus/my-profile`,
        dedupeKey: `quiz_certificate_issued:${certificate._id}`,
      }).catch(() => {});

      return certificate.populate(CERTIFICATE_POPULATE);
    } catch (error: any) {
      lastError = error;

      if (isDuplicateKeyError(error)) {
        // Race condition: another request created it concurrently — return the existing one
        const raceCertificate = await QuizCertificate.findOne({
          user: new Types.ObjectId(userId),
          pillar: new Types.ObjectId(pillarId),
        }).populate(CERTIFICATE_POPULATE);

        if (raceCertificate) {
          return raceCertificate;
        }

        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

const getMyCertificates = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  return QuizCertificate.find({
    user: new Types.ObjectId(userId),
  })
    .sort({ issuedAt: -1 })
    .populate(CERTIFICATE_POPULATE);
};

const getMySingleCertificate = async (
  userId: string,
  certificateId: string,
) => {
  assertValidObjectId(userId, "User ID");
  assertValidObjectId(certificateId, "Certificate ID");

  const certificate = await QuizCertificate.findOne({
    _id: certificateId,
    user: new Types.ObjectId(userId),
  }).populate(CERTIFICATE_POPULATE);

  assertFound(certificate, "Certificate not found", 404);

  return certificate;
};


const verifyCertificateByNumber = async (certificateNumber: string) => {
  const certificate = await QuizCertificate.findOne({
    certificateNumber: certificateNumber.trim().toUpperCase(),
  }).populate(CERTIFICATE_POPULATE);

  assertFound(certificate, "Certificate not found", 404);

  return {
    valid: certificate.status === "issued",
    certificate,
  };
};

const getSingleCertificateAdmin = async (certificateId: string) => {
  assertValidObjectId(certificateId, "Certificate ID");

  const certificate = await QuizCertificate.findById(
    certificateId,
  ).populate(CERTIFICATE_POPULATE);

  assertFound(certificate, "Certificate not found", 404);

  return certificate;
};

const getAllCertificatesAdmin = async (query: IQuizCertificateAdminQuery) => {
  const filter: QueryFilter<IQuizCertificate> = {};

  if (query.userId) {
    assertValidObjectId(query.userId, "User ID");

    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.moduleId) {
    assertValidObjectId(query.moduleId, "Course module ID");

    filter.module = new Types.ObjectId(query.moduleId);
  }

  if (query.pillarId) {
    assertValidObjectId(query.pillarId, "Challenge pillar ID");

    filter.pillar = new Types.ObjectId(query.pillarId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [certificates, total] = await Promise.all([
    QuizCertificate.find(filter)
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(CERTIFICATE_POPULATE),

    QuizCertificate.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },

    data: certificates,
  };
};

const attachCertificateUrl = async (
  certificateId: string,
  payload: IAttachCertificateUrl,
) => {
  assertValidObjectId(certificateId, "Certificate ID");

  const certificate = await QuizCertificate.findById(certificateId);

  assertFound(certificate, "Certificate not found", 404);

  certificate.certificateUrl = payload.certificateUrl;

  await certificate.save();

  return certificate.populate(CERTIFICATE_POPULATE);
};

const revokeCertificate = async (
  certificateId: string,
  actorId: string,
  reason?: string | undefined,
) => {
  assertValidObjectId(certificateId, "Certificate ID");
  assertValidObjectId(actorId, "Actor ID");

  const certificate = await QuizCertificate.findById(certificateId);

  assertFound(certificate, "Certificate not found", 404);

  if (certificate.status === "revoked") {
    throwServiceError("Certificate is already revoked", 400);
  }

  certificate.status = "revoked";
  certificate.revokedAt = new Date();
  certificate.revokedBy = new Types.ObjectId(actorId);

  if (reason !== undefined) {
    certificate.revokedReason = reason;
  }

  await certificate.save();

  return certificate.populate(CERTIFICATE_POPULATE);
};

const isAdminOrManagerRole = isAdminOrManager;

export const quizCertificateService = {
  issueCertificateIfEligible,

  getMyCertificates,
  getMySingleCertificate,

  verifyCertificateByNumber,

  getSingleCertificateAdmin,
  getAllCertificatesAdmin,

  attachCertificateUrl,
  revokeCertificate,

  isAdminOrManagerRole,
};
