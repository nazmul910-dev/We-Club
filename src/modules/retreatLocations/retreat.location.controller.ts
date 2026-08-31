// server/src/modules/retreatLocations/retreat.location.controller.ts
import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";
import {
  uploadRetreatCoverToCloudinary,
  uploadRetreatGalleryToCloudinary,
  uploadRetreatPromoVideoToCloudinary,
} from "../../utility/cloudinaryUpload";

import {
  ICreateRetreatLocation,
  IRetreatLocationQuery,
  IUpdateRetreatLocation,
} from "./retreat.location.interface";
import { retreatLocationService } from "./retreat.location.service";

const getAuthUser = (req: Request): { id: string; role: string } => {
  assertFound(req.user, "Authentication required", 401);
  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

type RetreatFiles = {
  coverImage?: Express.Multer.File[];
  gallery?: Express.Multer.File[];
  promoVideo?: Express.Multer.File[];
};

const createRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const files = req.files as RetreatFiles | undefined;

    const payload = { ...(req.body as ICreateRetreatLocation) };




    // Cover upload wins over any body URL
    if (files?.coverImage?.[0]) {
      payload.coverImage = await uploadRetreatCoverToCloudinary(
        files.coverImage[0],
      );
    }

    // Gallery uploads append to any existing URL list from body
    if (files?.gallery?.length) {
      const uploaded = await Promise.all(
        files.gallery.map((file) => uploadRetreatGalleryToCloudinary(file)),
      );
      payload.galleryImages = [...(payload.galleryImages ?? []), ...uploaded];
    }

    if (files?.promoVideo?.[0]) {
      payload.promoVideoUrl = await uploadRetreatPromoVideoToCloudinary(
        files.promoVideo[0],
      );
    }


    const location = await retreatLocationService.createRetreatLocation(
      payload,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Retreat location created successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRetreatLocations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isPublicOnly =
      !req.user ||
      (req.user.role !== "founder" &&
        req.user.role !== "admin" &&
        req.user.role !== "manager" &&
        req.user.role !== "super_admin");

    const result = await retreatLocationService.getAllRetreatLocations(
      req.query as IRetreatLocationQuery,
      isPublicOnly,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat locations retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isPublicOnly =
      !req.user ||
      (req.user.role !== "founder" &&
        req.user.role !== "admin" &&
        req.user.role !== "manager" &&
        req.user.role !== "super_admin");

    const location = await retreatLocationService.getSingleRetreatLocation(
      String(req.params.idOrSlug),
      isPublicOnly,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location retrieved successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const updateRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const files = req.files as RetreatFiles | undefined;

    const payload = { ...(req.body as IUpdateRetreatLocation) };



    if (files?.coverImage?.[0]) {
      payload.coverImage = await uploadRetreatCoverToCloudinary(
        files.coverImage[0],
      );
    }

    if (files?.gallery?.length) {
      const uploaded = await Promise.all(
        files.gallery.map((file) => uploadRetreatGalleryToCloudinary(file)),
      );

      // If client sends replaceGallery=true, replace; otherwise append
      const replace =
        (req.body as { replaceGallery?: boolean }).replaceGallery === true;

      if (replace) {
        payload.galleryImages = uploaded;
      } else {
        payload.galleryImages = [
          ...(payload.galleryImages ?? []),
          ...uploaded,
        ];
      }
    }

    if (files?.promoVideo?.[0]) {
      payload.promoVideoUrl = await uploadRetreatPromoVideoToCloudinary(
        files.promoVideo[0],
      );
    }

    const location = await retreatLocationService.updateRetreatLocation(
      String(req.params.id),
      payload,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location updated successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await retreatLocationService.deleteRetreatLocation(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const retreatLocationController = {
  createRetreatLocation,
  getAllRetreatLocations,
  getSingleRetreatLocation,
  updateRetreatLocation,
  deleteRetreatLocation,
};