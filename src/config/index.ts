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

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY:
  process.env.STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY,

STRIPE_PRICE_INVICTUS_MONTHLY:
  process.env.STRIPE_PRICE_INVICTUS_MONTHLY,

STRIPE_PRICE_BOTH_MONTHLY:
  process.env.STRIPE_PRICE_BOTH_MONTHLY,

STRIPE_PRICE_CEO_YEARLY:
  process.env.STRIPE_PRICE_CEO_YEARLY,

STRIPE_PRICE_CEO_PARTNER_YEARLY:
  process.env.STRIPE_PRICE_CEO_PARTNER_YEARLY,
}