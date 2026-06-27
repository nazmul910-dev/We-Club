import { v2 as cloudinary } from 'cloudinary';
import config from '../config';

cloudinary.config({
  cloud_name:config.CLOUDINARY_CLOUD_NAME  ,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET ,
});

export const uploadImageToCloudinary = async (
  file: Express.Multer.File,
  folder = 'newaza/profile-images'
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