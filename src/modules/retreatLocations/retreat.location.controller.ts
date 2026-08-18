import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import assertFound from "../../utility/assertFound";
import { uploadImageToCloudinary } from "../../utility/cloudinaryUpload";
import { parseIfString } from "../../utility/parseIfString";

import {
  ICreateRetreatLocation,
  IRetreatLocationQuery,
  IUpdateRetreatLocation,
} from "./retreat.location.interface";

import { retreatLocationService } from "./retreat.location.service";

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

const createRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const files = req.files as
      | {
          coverImage?: Express.Multer.File[] | undefined;
          gallery?: Express.Multer.File[] | undefined;
        }
      | undefined;

    let coverImage =
      typeof req.body.coverImage === "string" && req.body.coverImage.trim() !== ""
        ? req.body.coverImage.trim()
        : undefined;

    let gallery: string[] = Array.isArray(req.body.gallery)
      ? req.body.gallery
      : typeof req.body.gallery === "string"
        ? parseIfString(req.body.gallery)
        : [];

    if (!Array.isArray(gallery)) {
      gallery = [];
    }

    const coverFile = files?.coverImage?.[0];
    const galleryFiles = files?.gallery ?? [];

    // Parallel upload of cover and gallery files to Cloudinary
    if (coverFile || galleryFiles.length > 0) {
      const [uploadedCover, ...uploadedGallery] = await Promise.all([
        coverFile
          ? uploadImageToCloudinary(coverFile, "retreats/covers")
          : Promise.resolve(undefined),
        ...galleryFiles.map((file) =>
          uploadImageToCloudinary(file, "retreats/gallery"),
        ),
      ]);

      if (uploadedCover) {
        coverImage = uploadedCover;
      }

      if (uploadedGallery.length > 0) {
        const validGalleryUrls = uploadedGallery.filter(Boolean) as string[];
        gallery = [...gallery, ...validGalleryUrls];
      }
    }

    assertFound(
      coverImage,
      "coverImage is required (either as an uploaded file or valid URL)",
      400,
    );

    const payload: ICreateRetreatLocation = {
      name: req.body.name,
      slug: req.body.slug,
      country: req.body.country,
      city: req.body.city,
      stateOrProvince: req.body.stateOrProvince,
      address: req.body.address,
      description: req.body.description,
      shortDescription: req.body.shortDescription,
      coverImage,
      gallery,
      venueDetails: parseIfString(req.body.venueDetails),
      coordinates: parseIfString(req.body.coordinates),
      amenities: parseIfString(req.body.amenities),
      featured:
        req.body.featured === "true"
          ? true
          : req.body.featured === "false"
            ? false
            : req.body.featured,
      isActive:
        req.body.isActive === "true"
          ? true
          : req.body.isActive === "false"
            ? false
            : req.body.isActive,
      order: req.body.order !== undefined ? Number(req.body.order) : undefined,
    };

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
    const actorRole = req.user?.role as string | undefined;

    const query: IRetreatLocationQuery = {
      country: req.query.country as string | undefined,
      city: req.query.city as string | undefined,
      featured:
        req.query.featured === "true"
          ? true
          : req.query.featured === "false"
            ? false
            : undefined,
      status: req.query.status as any,
      isActive:
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    const result = await retreatLocationService.getAllRetreatLocations(
      query,
      actorRole,
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

const getFeaturedRetreatLocations = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const locations =
      await retreatLocationService.getFeaturedRetreatLocations();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Featured retreat locations retrieved successfully",
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleRetreatLocationById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorRole = req.user?.role as string | undefined;
    const locationId = String(req.params.id);

    const location =
      await retreatLocationService.getSingleRetreatLocationById(
        locationId,
        actorRole,
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

const getSingleRetreatLocationBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorRole = req.user?.role as string | undefined;
    const slug = String(req.params.slug);

    const location =
      await retreatLocationService.getSingleRetreatLocationBySlug(
        slug,
        actorRole,
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
    const locationId = String(req.params.id);

    const files = req.files as
      | {
          coverImage?: Express.Multer.File[] | undefined;
          gallery?: Express.Multer.File[] | undefined;
        }
      | undefined;

    let coverImage =
      typeof req.body.coverImage === "string" && req.body.coverImage.trim() !== ""
        ? req.body.coverImage.trim()
        : undefined;

    let gallery: string[] | undefined = Array.isArray(req.body.gallery)
      ? req.body.gallery
      : typeof req.body.gallery === "string"
        ? parseIfString(req.body.gallery)
        : undefined;

    const coverFile = files?.coverImage?.[0];
    const galleryFiles = files?.gallery ?? [];

    if (coverFile || galleryFiles.length > 0) {
      const [uploadedCover, ...uploadedGallery] = await Promise.all([
        coverFile
          ? uploadImageToCloudinary(coverFile, "retreats/covers")
          : Promise.resolve(undefined),
        ...galleryFiles.map((file) =>
          uploadImageToCloudinary(file, "retreats/gallery"),
        ),
      ]);

      if (uploadedCover) {
        coverImage = uploadedCover;
      }

      if (uploadedGallery.length > 0) {
        const validGalleryUrls = uploadedGallery.filter(Boolean) as string[];
        gallery = [...(gallery ?? []), ...validGalleryUrls];
      }
    }

    const payload: IUpdateRetreatLocation = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.slug !== undefined && { slug: req.body.slug }),
      ...(req.body.country !== undefined && { country: req.body.country }),
      ...(req.body.city !== undefined && { city: req.body.city }),
      ...(req.body.stateOrProvince !== undefined && {
        stateOrProvince: req.body.stateOrProvince,
      }),
      ...(req.body.address !== undefined && { address: req.body.address }),
      ...(req.body.description !== undefined && {
        description: req.body.description,
      }),
      ...(req.body.shortDescription !== undefined && {
        shortDescription: req.body.shortDescription,
      }),
      ...(coverImage && { coverImage }),
      ...(gallery && { gallery }),
      ...(req.body.venueDetails !== undefined && {
        venueDetails: parseIfString(req.body.venueDetails),
      }),
      ...(req.body.coordinates !== undefined && {
        coordinates: parseIfString(req.body.coordinates),
      }),
      ...(req.body.amenities !== undefined && {
        amenities: parseIfString(req.body.amenities),
      }),
      ...(req.body.featured !== undefined && {
        featured:
          req.body.featured === "true"
            ? true
            : req.body.featured === "false"
              ? false
              : req.body.featured,
      }),
      ...(req.body.isActive !== undefined && {
        isActive:
          req.body.isActive === "true"
            ? true
            : req.body.isActive === "false"
              ? false
              : req.body.isActive,
      }),
      ...(req.body.order !== undefined && {
        order: Number(req.body.order),
      }),
    };

    const location = await retreatLocationService.updateRetreatLocation(
      locationId,
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

const publishRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const locationId = String(req.params.id);

    const location = await retreatLocationService.publishRetreatLocation(
      locationId,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location published successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const moveRetreatLocationToDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const locationId = String(req.params.id);

    const location = await retreatLocationService.moveRetreatLocationToDraft(
      locationId,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location moved to draft successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const archiveRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const locationId = String(req.params.id);

    const location = await retreatLocationService.archiveRetreatLocation(
      locationId,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location archived successfully",
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
    const locationId = String(req.params.id);

    const result =
      await retreatLocationService.deleteRetreatLocation(locationId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const retreatLocationController = {
  createRetreatLocation,
  getAllRetreatLocations,
  getFeaturedRetreatLocations,
  getSingleRetreatLocationById,
  getSingleRetreatLocationBySlug,
  updateRetreatLocation,
  publishRetreatLocation,
  moveRetreatLocationToDraft,
  archiveRetreatLocation,
  deleteRetreatLocation,
};
