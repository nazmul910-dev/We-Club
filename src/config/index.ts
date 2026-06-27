import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), ".env") })
export default {
    MONGO_URI: process.env.MONGO_URI || "",
    DB_NAME: process.env.DB_NAME || "",
    JWT_SECRET: process.env.JWT_SECRET || "change_this_secret",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
    SALT_ROUNDS: process.env.SALT_ROUNDS || 10,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    SMTP_AUTH_USER: process.env.SMTP_AUTH_USER,
    SMTP_AUTH_PASS: process.env.SMTP_AUTH_PASS,
    NODE_ENV: process.env.NODE_ENV,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

    DEFAULT_PROFILE_IMAGE_URL:
        process.env.DEFAULT_PROFILE_IMAGE_URL ||
        'https://res.cloudinary.com/demo/image/upload/v1/default-profile.png',

    CALENDLY_MEETING_URL: process.env.CALENDLY_MEETING_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'NAZMUL Hasan',    
}