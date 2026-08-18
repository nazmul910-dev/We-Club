import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);
    const isExtValid = allowedExtensions.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'));
    }

    cb(null, true);
  },
});
 
/**
 * For createListing: expects a single "cover_image" file and up to 10 "images" files
 * in the same multipart/form-data submission.
 */
export const uploadListingImages = upload.fields([
  { name: "cover_image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

/**
 * For createRetreatLocation / updateRetreatLocation:
 * expects a single "coverImage" file and up to 10 "gallery" files
 * in the multipart/form-data submission.
 */
export const uploadRetreatImages = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
]);