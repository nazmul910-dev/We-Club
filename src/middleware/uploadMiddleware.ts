import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const allowedImageMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const allowedImageExts = [".jpg", ".jpeg", ".png", ".webp"];

const allowedVideoMimes = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-m4v",
  "video/mpeg",
];
const allowedVideoExts = [".mp4", ".webm", ".mov", ".m4v", ".mpeg", ".mpg"];

export const upload = multer({
  storage,
  limits: {
    // 150MB so a promo video can fit; images stay small in practice
    fileSize: 150 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "promoVideo") {
      const ok =
        allowedVideoMimes.includes(file.mimetype) ||
        allowedVideoExts.includes(ext);
      if (!ok) {
        return cb(
          new Error("Promo video must be MP4, WEBM, MOV, M4V, or MPEG"),
        );
      }
      return cb(null, true);
    }

    // coverImage + gallery
    const ok =
      allowedImageMimes.includes(file.mimetype) ||
      allowedImageExts.includes(ext);
    if (!ok) {
      return cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"));
    }
    return cb(null, true);
  },
});

export const uploadListingImages = upload.fields([
  { name: "cover_image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

export const uploadRetreatImages = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
  { name: "promoVideo", maxCount: 1 },
]);