import { QueryFilter, Types } from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";
import { ModuleProgress } from "../moduleProgress/module.progress.model.schema";

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

const buildCertificateNumber = (
  pillarSlug: string,
  moduleNumber: number,
): string => {
  return [
    "INV",
    pillarSlug.toUpperCase(),
    `M${moduleNumber}`,
    randomAlphaNumeric(6),
  ].join("-");
};


const issueCertificateIfEligible = async (
  userId: string,
  moduleId: string,
) => {
  assertValidObjectId(userId, "User ID");
  assertValidObjectId(moduleId, "Course module ID");

  const existingCertificate = await QuizCertificate.findOne({
    user: new Types.ObjectId(userId),
    module: new Types.ObjectId(moduleId),
  }).populate(CERTIFICATE_POPULATE);

  if (existingCertificate) {
    return existingCertificate;
  }

  const moduleProgress = await ModuleProgress.findOne({
    user: new Types.ObjectId(userId),
    module: new Types.ObjectId(moduleId),
  }).lean();

  assertFound(
    moduleProgress,
    "Module progress not found. Complete the module requirements first",
    404,
  );

  if (!moduleProgress.quizSummary?.passed) {
    throwServiceError(
      "Quiz must be passed before a certificate can be issued",
      403,
    );
  }

  const courseModule = await CourseModule.findById(moduleId).populate(
    "pillar",
    "name slug title status",
  );

  assertFound(courseModule, "Course module not found", 404);

  const pillar = courseModule.pillar as unknown as {
    _id: Types.ObjectId;
    slug: string;
  };

  assertFound(pillar, "Parent challenge pillar not found", 404);

  const createData: Record<string, unknown> = {
    user: new Types.ObjectId(userId),
    module: new Types.ObjectId(moduleId),
    pillar: pillar._id,

    certificateNumber: buildCertificateNumber(
      pillar.slug,
      courseModule.moduleNumber,
    ),

    status: "issued",

    score: moduleProgress.quizSummary.bestScore,

    issuedAt: new Date(),
  };


  const MAX_ATTEMPTS = 5;

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const certificate = await QuizCertificate.create({
        ...createData,

        certificateNumber: buildCertificateNumber(
          pillar.slug,
          courseModule.moduleNumber,
        ),
      });

      return certificate.populate(CERTIFICATE_POPULATE);
    } catch (error) {
      lastError = error;

      if (isDuplicateKeyError(error)) {

        const raceCertificate = await QuizCertificate.findOne({
          user: new Types.ObjectId(userId),
          module: new Types.ObjectId(moduleId),
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
