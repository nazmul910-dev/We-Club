import { Readable } from "node:stream";
import {
  v2 as cloudinary,
  type UploadApiOptions,
  type UploadApiResponse,
} from "cloudinary";

import config from "../config";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadBufferToCloudinary = async (
  file: Express.Multer.File | undefined,
  options: UploadApiOptions
): Promise<UploadApiResponse> => {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary did not return an upload result"));
          return;
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

export const uploadImageToCloudinary = async (
  file: Express.Multer.File | undefined,
  folder = "newaza/profile-images"
): Promise<string> => {
  const result = await uploadBufferToCloudinary(file, {
    folder,
    resource_type: "image",
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });

  return result.secure_url;
};

export interface ICloudinaryVideoUpload {
  cloudinaryPublicId: string;
  cloudinaryAssetId?: string | undefined;
  secureUrl: string;
  playbackUrl: string;
  thumbnailUrl: string;
  folder?: string | undefined;
  format?: string | undefined;
  durationSeconds: number;
  bytes?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

export interface ICloudinaryResourceUpload {
  cloudinaryPublicId: string;
  cloudinaryAssetId?: string | undefined;
  secureUrl: string;
  thumbnailUrl?: string | undefined;
  fileName: string;
  mimeType: string;
  format?: string | undefined;
  bytes?: number | undefined;
  cloudinaryResourceType: "image" | "raw" | "video";
}

const buildVideoPlaybackUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    resource_type: "video",
    secure: true,
    transformation: [
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
};

const buildVideoThumbnailUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    resource_type: "video",
    secure: true,
    format: "jpg",
    transformation: [
      {
        start_offset: "2",
        width: 1280,
        height: 720,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
      },
    ],
  });
};

const buildPdfThumbnailUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    resource_type: "image",
    secure: true,
    format: "jpg",
    page: 1,
    transformation: [
      {
        width: 1200,
        height: 1600,
        crop: "fit",
        quality: "auto",
      },
    ],
  });
};

export const uploadVideoToCloudinary = async (
  file: Express.Multer.File | undefined,
  folder: string
): Promise<ICloudinaryVideoUpload> => {
  const result = await uploadBufferToCloudinary(file, {
    folder,
    resource_type: "video",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    eager_async: true,
    eager: [
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });

  const data: ICloudinaryVideoUpload = {
    cloudinaryPublicId: result.public_id,
    secureUrl: result.secure_url,
    playbackUrl: buildVideoPlaybackUrl(result.public_id),
    thumbnailUrl: buildVideoThumbnailUrl(result.public_id),
    durationSeconds:
      typeof result.duration === "number" ? result.duration : 0,
  };

  if (typeof result.asset_id === "string") {
    data.cloudinaryAssetId = result.asset_id;
  }

  if (typeof result.folder === "string") {
    data.folder = result.folder;
  }

  if (typeof result.format === "string") {
    data.format = result.format;
  }

  if (typeof result.bytes === "number") {
    data.bytes = result.bytes;
  }

  if (typeof result.width === "number") {
    data.width = result.width;
  }

  if (typeof result.height === "number") {
    data.height = result.height;
  }

  return data;
};

export const uploadResourceToCloudinary = async (
  file: Express.Multer.File | undefined,
  folder: string
): Promise<ICloudinaryResourceUpload> => {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  const result = await uploadBufferToCloudinary(file, {
    folder,
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  const resourceType =
    result.resource_type === "raw" || result.resource_type === "video"
      ? result.resource_type
      : "image";

  const data: ICloudinaryResourceUpload = {
    cloudinaryPublicId: result.public_id,
    secureUrl: result.secure_url,
    fileName: file.originalname,
    mimeType: file.mimetype,
    cloudinaryResourceType: resourceType,
  };

  if (typeof result.asset_id === "string") {
    data.cloudinaryAssetId = result.asset_id;
  }

  if (typeof result.format === "string") {
    data.format = result.format;
  }

  if (typeof result.bytes === "number") {
    data.bytes = result.bytes;
  }

  if (file.mimetype === "application/pdf" && resourceType === "image") {
    data.thumbnailUrl = buildPdfThumbnailUrl(result.public_id);
  }

  return data;
};

export const uploadThumbnailToCloudinary = async (
  file: Express.Multer.File | undefined,
  folder: string
): Promise<string> => {
  const result = await uploadBufferToCloudinary(file, {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    transformation: [
      {
        width: 1200,
        height: 675,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });

  return result.secure_url;
};

export const deleteCloudinaryAsset = async (
  publicId: string,
  resourceType: "image" | "raw" | "video"
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};

export { cloudinary };