import multer from 'multer';

const storage = multer.memoryStorage();

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
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