import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import assertFound from "../../utility/assertFound";

import { IQuizCertificateAdminQuery } from "./quiz.certificate.interface";
import { quizCertificateService } from "./quiz.certificate.service";

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  assertFound(req.user, "Authentication required", 401);

  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

const issueMyCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const certificate = await quizCertificateService.issueCertificateIfEligible(
      authUser.id,
      String(req.params.pillarId),
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Certificate issued successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

const getMyCertificates = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const certificates = await quizCertificateService.getMyCertificates(
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Certificates retrieved successfully",
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

const getMySingleCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const certificate = await quizCertificateService.getMySingleCertificate(
      authUser.id,
      String(req.params.certificateId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Certificate retrieved successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

const verifyCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await quizCertificateService.verifyCertificateByNumber(
      String(req.params.certificateNumber),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Certificate verification completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleCertificateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const certificate = await quizCertificateService.getSingleCertificateAdmin(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Certificate retrieved successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCertificatesAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const query: IQuizCertificateAdminQuery = {};

    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }

    if (typeof req.query.moduleId === "string") {
      query.moduleId = req.query.moduleId;
    }

    if (typeof req.query.pillarId === "string") {
      query.pillarId = req.query.pillarId;
    }

    if (
      req.query.status === "issued" ||
      req.query.status === "revoked"
    ) {
      query.status = req.query.status;
    }

    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }

    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }

    const result = await quizCertificateService.getAllCertificatesAdmin(
      query,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Certificates retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const attachCertificateUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const certificate = await quizCertificateService.attachCertificateUrl(
      String(req.params.id),
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Certificate file attached successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

const revokeCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const certificate = await quizCertificateService.revokeCertificate(
      String(req.params.id),
      authUser.id,
      req.body?.reason,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Certificate revoked successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

export const quizCertificateController = {
  issueMyCertificate,

  getMyCertificates,
  getMySingleCertificate,

  verifyCertificate,

  getSingleCertificateAdmin,
  getAllCertificatesAdmin,

  attachCertificateUrl,
  revokeCertificate,
};
