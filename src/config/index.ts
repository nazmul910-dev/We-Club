import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.join(process.cwd(),".env")})
export default{
    MONGO_URI : process.env.MONGO_URI || "",
    DB_NAME : process.env.DB_NAME || "",
    JWT_SECRET: process.env.JWT_SECRET || "change_this_secret",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
    SALT_ROUNDS: process.env.SALT_ROUNDS || 10,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    SMTP_AUTH_USER:process.env.SMTP_AUTH_USER,
    SMTP_AUTH_PASS: process.env.SMTP_AUTH_PASS,
    NODE_ENV: process.env.NODE_ENV,
    JWT_REFRESH_SECRET:process.env.JWT_REFRESH_SECRET,
}