import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const memoryStorage = multer.memoryStorage();

const allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/mpeg",
];

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const allowedResourceTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  ...allowedImageTypes,
];

export const uploadModuleVideo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 150 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only MP4, WEBM, MOV, M4V, and MPEG video files are allowed")
      );
    }

    return callback(null, true);
  },
});

export const uploadMentorBookingRecording = multer({
  storage: memoryStorage,
  limits: {
    // Session recordings run longer than course videos, so allow up to 1GB
    fileSize: 1024 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only MP4, WEBM, MOV, M4V, and MPEG video files are allowed")
      );
    }

    return callback(null, true);
  },
});

export const uploadModuleResource = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 2,
  },
  fileFilter: (_req, file, callback) => {
    if (file.fieldname === "thumbnail") {
      if (!allowedImageTypes.includes(file.mimetype)) {
        return callback(
          new Error("Thumbnail must be JPG, JPEG, PNG, or WEBP")
        );
      }

      return callback(null, true);
    }

    if (file.fieldname === "resource") {
      if (!allowedResourceTypes.includes(file.mimetype)) {
        return callback(
          new Error(
            "Unsupported resource type. Upload PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG, or WEBP"
          )
        );
      }

      return callback(null, true);
    }

    return callback(new Error(`Unexpected upload field: ${file.fieldname}`));
  },
});

export const uploadModuleResourceFields = uploadModuleResource.fields([
  { name: "resource", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

const parseBoolean = (
  value: unknown
): boolean | undefined => {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return undefined;
};


const parseNumber = (value: unknown): unknown => {
  if (typeof value !== "string" || value.trim() === "") {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

export const normalizeModuleVideoMultipartBody = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const parsedIsPaid = parseBoolean(
    req.body.isPaid
  );

  const parsedIsRequired = parseBoolean(
    req.body.isRequired
  );

  if (parsedIsPaid !== undefined) {
    req.body.isPaid = parsedIsPaid;
  }

  if (parsedIsRequired !== undefined) {
    req.body.isRequired =
      parsedIsRequired;
  }

  if (
    req.body.requiredWatchPercent !==
    undefined
  ) {
    req.body.requiredWatchPercent =
      Number(
        req.body.requiredWatchPercent
      );
  }

  if (
    req.body.pointsReward !== undefined
  ) {
    req.body.pointsReward = Number(
      req.body.pointsReward
    );
  }

  if (req.body.order !== undefined) {
    req.body.order = Number(
      req.body.order
    );
  }

  next();
};

export const normalizeModuleResourceMultipartBody = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  req.body.isRequired = parseBoolean(req.body.isRequired);
  req.body.pointsReward = parseNumber(req.body.pointsReward);
  req.body.order = parseNumber(req.body.order);

  return next();
};

export const getUploadedFieldFile = (
  req: Request,
  fieldName: string
): Express.Multer.File | undefined => {
  const files = req.files;

  if (!files || Array.isArray(files)) {
    return undefined;
  }

  const fieldFiles = files[fieldName];
  return fieldFiles?.[0];
};