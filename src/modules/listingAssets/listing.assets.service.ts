import { ZipArchive } from 'archiver';
import type { Archiver } from 'archiver';
import { Types } from 'mongoose';

import { Listing } from '../listings/listings.model.schema';
import { PromoteRequest } from '../listingPromote/listings.promote.request.model.schema';
import { UserRole } from '../users/user.interface';
import { ListingAssetDownload } from './listing.assets.model.schema';
import {
  downloadImageFromUrl,
  generateCaptionsTextFile,
  generateListingCaptions,
  generateListingOnePagerPdf,
  sanitizeFileName,
} from './listing.assets.utils';

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

type DownloadMeta = {
  ip_address?: string | undefined;
  user_agent?: string | undefined;
};

type DownloadZipResult = {
  archive: Archiver;
  fileName: string;
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const toObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throwError('Invalid id', 400);
  }

  return new Types.ObjectId(id);
};

const isAdminOrManager = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager';
};

const isAllowedPromoterRole = (role: UserRole): boolean => {
  return role === 'associate' || role === 'partner' || role === 'ambassador';
};

const ensureListingExists = <T>(
  listing: T | null | undefined
): NonNullable<T> => {
  if (listing == null) {
    throwError('Listing not found', 404);
  }

  return listing as NonNullable<T>;
};

const filterValidImageUrls = (imageUrls: Array<string | undefined | null>): string[] => {
  return imageUrls.filter((imageUrl): imageUrl is string => {
    return typeof imageUrl === 'string' && imageUrl.trim().length > 0;
  });
};

const downloadListingAssetsZipFromDB = async (
  listingId: string,
  authUser: AuthUser,
  meta: DownloadMeta
): Promise<DownloadZipResult> => {
  const listing = await Listing.findById(listingId).lean();

  const safeListing = ensureListingExists(listing);

  const isListingOwner = String(safeListing.associate_id) === authUser.id;

  let promotionRequestId: Types.ObjectId | undefined;

  const hasDirectAccess = isAdminOrManager(authUser.role) || isListingOwner;

  if (!hasDirectAccess) {
    if (!isAllowedPromoterRole(authUser.role)) {
      throwError('You are not allowed to download listing assets', 403);
    }

    const approvedRequest = await PromoteRequest.findOne({
      listing_id: toObjectId(listingId),
      "requester.user_id": toObjectId(authUser.id),
      status: 'approved',
    }).lean();
 
    if (!approvedRequest) {
      throwError(
        'You must be approved to promote this listing before downloading assets',
        403
      );
    }

    promotionRequestId = approvedRequest?._id as Types.ObjectId;
  }

  const rawImageUrls = filterValidImageUrls([
    safeListing.cover_image,
    ...(safeListing.images || []),
  ]);

  const uniqueImageUrls = [...new Set(rawImageUrls)];

  const downloadedImages = await Promise.all(
    uniqueImageUrls.map((imageUrl, index) => {
      const fileNamePrefix =
        index === 0 ? 'cover-image' : `property-image-${index}`;

      return downloadImageFromUrl(imageUrl, fileNamePrefix);
    })
  );

  const validImages = downloadedImages.filter(
    (image): image is NonNullable<typeof image> => Boolean(image)
  );

  const captions = generateListingCaptions(safeListing);

  const onePagerPdfBuffer = await generateListingOnePagerPdf(
    safeListing,
    validImages,
    captions
  );

  const captionsText = generateCaptionsTextFile(captions);

  const archive = new ZipArchive({
    zlib: {
      level: 9,
    },
  });

  const fileNames: string[] = [];

  validImages.forEach((image) => {
    const imageFilePath = `images/${image.fileName}`;

    archive.append(image.buffer, {
      name: imageFilePath,
    });

    fileNames.push(imageFilePath);
  });

  archive.append(onePagerPdfBuffer, {
    name: 'one-pager.pdf',
  });

  fileNames.push('one-pager.pdf');

  archive.append(captionsText, {
    name: 'captions.txt',
  });

  fileNames.push('captions.txt');

  const logPayload: Record<string, unknown> = {
    listing_id: toObjectId(listingId),
    downloaded_by: toObjectId(authUser.id),
    user_role: authUser.role,
    assets_snapshot: {
      package_type: 'zip',
      image_count: validImages.length,
      file_names: fileNames,
      captions,
      one_pager_file_name: 'one-pager.pdf',
    },
    downloaded_at: new Date(),
  };

  if (promotionRequestId) {
    logPayload.promotion_request_id = promotionRequestId;
  }

  if (meta.ip_address) {
    logPayload.ip_address = meta.ip_address;
  }

  if (meta.user_agent) {
    logPayload.user_agent = meta.user_agent;
  }

  await ListingAssetDownload.create(logPayload);

  const zipFileName = `${sanitizeFileName(
    safeListing.ref_code || safeListing.title
  )}-assets.zip`;

  return {
    archive,
    fileName: zipFileName,
  };
};

const getListingAssetLogsFromDB = async (
  listingId: string,
  authUser: AuthUser
) => {
  const listing = await Listing.findById(listingId).lean();

  const safeListing = ensureListingExists(listing);

  const isListingOwner = String(safeListing.associate_id) === authUser.id;

  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError('You are not allowed to view asset download logs', 403);
  }

  return ListingAssetDownload.find({
    listing_id: toObjectId(listingId),
  })
    .populate('downloaded_by', 'fullName email role')
    .populate('listing_id', 'title ref_code')
    .sort({ downloaded_at: -1 });
};

const getAllListingAssetLogsFromDB = async (authUser: AuthUser) => {
  if (!isAdminOrManager(authUser.role)) {
    throwError('Only admin or manager can view all asset download logs', 403);
  }

  return ListingAssetDownload.find()
    .populate('downloaded_by', 'fullName email role')
    .populate('listing_id', 'title ref_code')
    .sort({ downloaded_at: -1 });
};

export const listingAssetsService = {
  downloadListingAssetsZipFromDB,
  getListingAssetLogsFromDB,
  getAllListingAssetLogsFromDB,
};