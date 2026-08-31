import { v2 as cloudinary } from 'cloudinary';
import config from '../config';
import { uploadVideoToCloudinary } from './cloudinaryMedia';

cloudinary.config({
  cloud_name:config.CLOUDINARY_CLOUD_NAME  ,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET ,
});

export const uploadImageToCloudinary = async (
  file: Express.Multer.File,
  folder = 'adam/profile-images'
): Promise<string> => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    'base64'
  )}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: 'image',
    transformation: [
      {
        width: 500,
        height: 500,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  });

  return result.secure_url;
};

export const uploadLogoToCloudinary = async (
  file: Express.Multer.File,
  folder = 'adam/logo'
): Promise<string> => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    'base64'
  )}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: 'image',
  });

  return result.secure_url;
};


// server/src/utility/cloudinaryUpload.ts  (add these exports)

export const uploadRetreatCoverToCloudinary = async (
  file: Express.Multer.File,
  folder = "invictus/retreat-locations/cover",
): Promise<string> => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "image",
    transformation: [
      {
        width: 1600,
        height: 900,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });

  return result.secure_url;
};

export const uploadRetreatGalleryToCloudinary = async (
  file: Express.Multer.File,
  folder = "invictus/retreat-locations/gallery",
): Promise<string> => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "image",
    transformation: [
      {
        width: 1400,
        height: 1400,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });

  return result.secure_url;
};

export const uploadRetreatPromoVideoToCloudinary = async (
  file: Express.Multer.File,
  folder = "invictus/retreat-locations/promo-video",
): Promise<string> => {
  const result = await uploadVideoToCloudinary(file, folder);
  // store playback URL (or result.secureUrl — your choice)
  return result.playbackUrl || result.secureUrl;
};