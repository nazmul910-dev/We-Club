
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/server.ts
import mongoose from "mongoose";

// src/app.ts
import express from "express";
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error bro from monster",
    error: err
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/middleware/routeNotFoundHandler.ts
var routeNotFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
};
var routeNotFoundHandler_default = routeNotFoundHandler;

// src/routes/index.ts
import { Router as Router5 } from "express";

// src/modules/users/user.route.ts
import { Router } from "express";

// src/utility/queryBuilder.ts
var QueryBuilder = class _QueryBuilder {
  modelQuery;
  query;
  // Fields that are query-control params, not actual filter fields
  static EXCLUDED_FIELDS = ["search", "sort", "limit", "page", "fields"];
  constructor(modelQuery, query) {
    this.modelQuery = modelQuery;
    this.query = query;
  }
  search(searchableFields) {
    const searchTerm = this.query.search?.trim();
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" }
        }))
      });
    }
    return this;
  }
  filter() {
    const queryObj = { ...this.query };
    _QueryBuilder.EXCLUDED_FIELDS.forEach((field) => delete queryObj[field]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|ne)\b/g, (match) => `$${match}`);
    this.modelQuery = this.modelQuery.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    const sortBy = this.query.sort?.split(",").join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sortBy);
    return this;
  }
  paginate() {
    const page = Math.max(Number(this.query.page) || 1, 1);
    const limit = Math.max(Number(this.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }
  // Bonus: field selection support (e.g. ?fields=name,email)
  fieldsLimit() {
    const fields = this.query.fields?.split(",").join(" ") || "-__v";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }
  // Bonus: get total count for pagination metadata (call separately, not chained)
  async countTotal() {
    const filterQuery = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(filterQuery);
    const page = Math.max(Number(this.query.page) || 1, 1);
    const limit = Math.max(Number(this.query.limit) || 10, 1);
    const totalPage = Math.ceil(total / limit);
    return { page, limit, total, totalPage };
  }
};
var queryBuilder_default = QueryBuilder;

// src/modules/users/users.model.schema.ts
import { Schema, model } from "mongoose";

// src/modules/users/user.interface.ts
var USER_ROLES = [
  "admin",
  "manager",
  "ceo",
  "ceo_partner",
  "associate",
  "partner",
  "ambassador",
  "we_club_member"
];
var PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "failed",
  "refunded"
];
var APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected"
];
var ACCOUNT_STATUSES = [
  "active",
  "pending_payment",
  "pending_approval",
  "suspended",
  "rejected"
];
var LICENSE_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected"
];

// src/modules/users/users.model.schema.ts
var userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      required: true,
      enum: USER_ROLES
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    brokerage: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    profileImage: {
      type: String,
      trim: true
    },
    socialLinks: {
      linkedin: {
        type: String,
        trim: true
      },
      facebook: {
        type: String,
        trim: true
      },
      twitter: {
        type: String,
        trim: true
      },
      website: {
        type: String,
        trim: true
      }
    },
    marketingChannels: [
      {
        type: String,
        trim: true
      }
    ],
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid"
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "pending"
    },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "pending_payment"
    },
    licenseVerificationStatus: {
      type: String,
      enum: LICENSE_VERIFICATION_STATUSES,
      default: "pending"
    },
    subscriptionStartAt: {
      type: Date
    },
    subscriptionExpiresAt: {
      type: Date
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: {
      type: Date
    },
    rejectedReason: {
      type: String,
      trim: true
    },
    lifetimeCommissionEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    discretionScore: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);
var User = model("User", userSchema);

// src/modules/users/auth.service.ts
var getAllUsersFromDB = async (query) => {
  const queryBuilder = new queryBuilder_default(User.find().select("-password"), query).search(["name", "email"]).filter().sort().paginate();
  const users = await queryBuilder.modelQuery;
  return users;
};
var getSingleUserFromDB = async (id) => {
  const user = await User.findById(id);
  return user;
};
var userService = { getAllUsersFromDB, getSingleUserFromDB };

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  const { statusCode, success, message, data: responseData, error } = data;
  res.status(statusCode).json({
    success,
    message,
    data: responseData,
    error
  });
};
var sendResponse_default = sendResponse;

// src/modules/users/user.controller.ts
var getAllUsers = async (req, res, next) => {
  try {
    const query = req.query;
    const users = await userService.getAllUsersFromDB(query);
    if (!users || users.length === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "No users found",
        data: []
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Users retrieved successfully",
      data: users
    });
  } catch (error) {
    next(error);
  }
};
var getSingleUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await userService.getSingleUserFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User received successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var userController = { getAllUsers, getSingleUser };

// src/modules/users/user.route.ts
var router = Router();
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getSingleUser);
var userRoutes = router;

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import jwt2 from "jsonwebtoken";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config_default = {
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
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  DEFAULT_PROFILE_IMAGE_URL: process.env.DEFAULT_PROFILE_IMAGE_URL || "https://res.cloudinary.com/demo/image/upload/v1/default-profile.png",
  CALENDLY_MEETING_URL: process.env.CALENDLY_MEETING_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || "NAZMUL Hasan"
};

// src/utility/errorResponses.ts
var UnauthorizedError = class extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.statusCode = 401;
    this.name = "UnauthorizedError";
  }
};
var ExistingUserError = class extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.statusCode = 409;
    this.name = "ExistingUserError";
  }
};

// src/modules/users/user.validation.ts
import { z } from "zod";
var registerValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(100),
    role: z.enum([
      "admin",
      "associate",
      "partner",
      "ambassador",
      "ceo",
      "ceo_partner",
      "we_club_member"
    ]),
    licenseNumber: z.string().trim().optional(),
    brokerage: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    bio: z.string().trim().max(1e3).optional(),
    socialLinks: z.object({
      linkedin: z.string().url().optional(),
      instagram: z.string().url().optional(),
      website: z.string().url().optional()
    }).optional(),
    marketingChannels: z.array(z.string()).optional()
  })
});
var loginValidation = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8)
  })
});
var approveUserValidation = z.object({
  body: z.object({
    userId: z.string().min(1),
    durationDays: z.number().int().positive()
  })
});
var rejectUserValidation = z.object({
  body: z.object({
    userId: z.string().min(1),
    reason: z.string().trim().min(2).max(500)
  })
});

// src/utility/passwordUtil.ts
import bcrypt from "bcryptjs";
var DEFAULT_SALT_ROUNDS = 12;
var getSaltRounds = () => {
  const saltRounds = Number(config_default.SALT_ROUNDS);
  if (!Number.isInteger(saltRounds) || saltRounds < 10) {
    return DEFAULT_SALT_ROUNDS;
    ;
  }
  return saltRounds;
};
var hashPassword = async (password) => {
  return bcrypt.hash(password, getSaltRounds());
};
var comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// src/modules/auth/auth.utils.ts
import jwt from "jsonwebtoken";
var createToken = (jwtPayload, secret, expiresInSeconds) => {
  return jwt.sign(jwtPayload, secret, { expiresIn: expiresInSeconds });
};
var verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

// src/utility/SendMail.ts
import nodemailer from "nodemailer";
var sendMail = async (to, html) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    //config.NODE_ENV == 'production'
    auth: {
      user: config_default.SMTP_AUTH_USER,
      pass: config_default.SMTP_AUTH_PASS
    }
  });
  await transporter.sendMail({
    from: config_default.SMTP_AUTH_USER,
    to,
    subject: "Change Password",
    text: "Reset your Password within 10 minutes",
    html
  });
};
var SendMail_default = sendMail;

// src/utility/sendCalendlyMeeting.ts
import nodemailer2 from "nodemailer";
var getRequiredEnv = (value, key) => {
  if (!value) {
    throw new Error(`${key} is missing in environment variables`);
  }
  return value;
};
var escapeHtml = (value) => {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
};
var createTransporter = () => {
  const smtpUser = getRequiredEnv(config_default.SMTP_AUTH_USER, "SMTP_AUTH_USER");
  const smtpPass = getRequiredEnv(config_default.SMTP_AUTH_PASS, "SMTP_AUTH_PASS");
  return nodemailer2.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};
var sendEmail = async ({
  to,
  subject,
  html,
  text,
  replyTo
}) => {
  const smtpUser = getRequiredEnv(config_default.SMTP_AUTH_USER, "SMTP_AUTH_USER");
  const fromName = config_default.MAIL_FROM_NAME || "NEWAZA";
  await createTransporter().sendMail({
    from: `"${fromName}" <${smtpUser}>`,
    to,
    subject,
    html,
    text,
    replyTo
  });
};
var getUserCalendlyEmailHtml = (fullName, calendlyUrl) => {
  const safeName = escapeHtml(fullName);
  const safeCalendlyUrl = escapeHtml(calendlyUrl);
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; padding: 28px; border-radius: 12px;">
        <h2 style="margin: 0 0 16px; color: #111827;">Schedule Your 30-Minute Discussion</h2>

        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          Hello ${safeName},
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          Thank you for registering with NEWAZA. Your registration information has been received successfully.
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          Please select a suitable time for a 30-minute discussion using the Calendly link below.
        </p>

        <div style="margin: 26px 0;">
          <a href="${safeCalendlyUrl}" target="_blank"
            style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Schedule Meeting
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
          After you select a time, you will receive a meeting confirmation email with the final meeting details.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
          If the button does not work, copy and paste this link into your browser:<br />
          <a href="${safeCalendlyUrl}" target="_blank" style="color: #2563eb;">${safeCalendlyUrl}</a>
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          Regards,<br />
          NEWAZA Team
        </p>
      </div>
    </div>
  `;
};
var getAdminCalendlyNotificationHtml = (fullName, email, role, calendlyUrl) => {
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role);
  const safeCalendlyUrl = escapeHtml(calendlyUrl);
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; padding: 28px; border-radius: 12px;">
        <h2 style="margin: 0 0 16px; color: #111827;">New User Registration</h2>

        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          A new user has registered. The Calendly meeting scheduling link has been sent to this user.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Name</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Email</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600;">Role</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${safeRole}</td>
          </tr>
        </table>

        <p style="font-size: 15px; line-height: 1.6; color: #374151;">
          Calendly scheduling link:
        </p>

        <p style="font-size: 14px; line-height: 1.6;">
          <a href="${safeCalendlyUrl}" target="_blank" style="color: #2563eb;">${safeCalendlyUrl}</a>
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
          Once the user selects a slot, Calendly will send the selected date, time, and meeting details to the host/admin email.
        </p>
      </div>
    </div>
  `;
};
var sendCalendlyMeetingMail = async ({
  fullName,
  email,
  role
}) => {
  const adminEmail = getRequiredEnv(config_default.ADMIN_EMAIL, "ADMIN_EMAIL");
  const calendlyUrl = getRequiredEnv(
    config_default.CALENDLY_MEETING_URL,
    "CALENDLY_MEETING_URL"
  );
  const userEmailHtml = getUserCalendlyEmailHtml(fullName, calendlyUrl);
  const adminEmailHtml = getAdminCalendlyNotificationHtml(
    fullName,
    email,
    role,
    calendlyUrl
  );
  await Promise.all([
    sendEmail({
      to: email,
      subject: "Schedule Your 30-Minute NEWAZA Discussion",
      html: userEmailHtml,
      text: `Hello ${fullName}, thank you for registering with NEWAZA. Please schedule your 30-minute discussion here: ${calendlyUrl}`
    }),
    sendEmail({
      to: adminEmail,
      subject: `New Registration: ${fullName}`,
      html: adminEmailHtml,
      text: `New user registered. Name: ${fullName}, Email: ${email}, Role: ${role}. Calendly link sent: ${calendlyUrl}`,
      replyTo: email
    })
  ]);
};

// src/modules/auth/auth.service.ts
var createUser = async (payload) => {
  const { body } = registerValidation.parse({ body: payload });
  const existingUser = await User.findOne({ email: body.email });
  if (existingUser) throw new ExistingUserError("User already exists");
  const hashedPassword = await hashPassword(body.password);
  const user = await User.create({
    fullName: body.fullName,
    email: body.email,
    role: body.role,
    password: hashedPassword,
    paymentStatus: "unpaid",
    approvalStatus: "pending",
    accountStatus: "pending_approval",
    licenseVerificationStatus: "pending"
  });
  try {
    await sendCalendlyMeetingMail({
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error(
      "Calendly meeting email failed:",
      error instanceof Error ? error.message : error
    );
  }
  const userObject = user.toObject();
  return userObject;
};
var loginUser = async (payload) => {
  const { body } = loginValidation.parse({ body: payload });
  const user = await User.findOne({
    email: body.email
  }).select("+password");
  if (!user) {
    throw new Error("Invalid email or password.");
  }
  const isPasswordMatched = await comparePassword(body.password, user.password);
  if (!isPasswordMatched) {
    throw new Error("Invalid email or password.");
  }
  if (user.approvalStatus === "pending") {
    throw new Error(
      "Your account is pending admin approval. Please try again later."
    );
  }
  if (user.approvalStatus === "rejected") {
    throw new Error(
      "Your registration request has been rejected. This email cannot be used to access the platform. Please contact support for further assistance."
    );
  }
  if (user.approvalStatus !== "approved") {
    throw new Error("Your account is not approved yet. Please try again later.");
  }
  if (user.accountStatus === "pending_approval") {
    throw new Error(
      "Your account is pending admin approval. Please try again later."
    );
  }
  if (user.accountStatus === "pending_payment") {
    throw new Error(
      "Your account payment is not completed yet. Please complete your payment to continue."
    );
  }
  if (user.accountStatus === "suspended") {
    throw new Error(
      "Your account has been suspended. Please contact support for further assistance."
    );
  }
  if (user.accountStatus === "rejected") {
    throw new Error(
      "Your account request has been rejected. This email cannot be used to access the platform. Please contact support for further assistance."
    );
  }
  if (user.accountStatus !== "active") {
    throw new Error("Your account is not active. Please contact support.");
  }
  const jwtPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
  const accessToken = jwt2.sign(
    jwtPayload,
    config_default.JWT_ACCESS_SECRET,
    {
      expiresIn: "7d"
    }
  );
  const refreshToken = createToken(
    {
      userId: user._id.toString(),
      role: user.role
    },
    config_default.JWT_REFRESH_SECRET,
    7 * 24 * 60 * 60
  );
  const userObject = user.toObject();
  return {
    accessToken,
    refreshToken,
    user: userObject
  };
};
var changePassword = async (userData, payload) => {
  const user = await User.findOne({ email: userData.email }).select("+password");
  console.log("users1:", user);
  if (!user) {
    throw new ExistingUserError("User not exists");
  }
  const isPasswordMatched = await comparePassword(payload.oldPassword, user.password);
  if (!isPasswordMatched) {
    throw new ExistingUserError("Old password is incorrect");
  }
  const hashedNewPassword = await hashPassword(payload.newPassword);
  await User.findOneAndUpdate(
    { email: userData.email },
    { password: hashedNewPassword }
  );
  return {
    message: "Password changed successfully"
  };
};
var forgetPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new ExistingUserError("User not found");
  const jwtPayload = {
    userId: user._id.toString(),
    role: user.role
  };
  const token = createToken(
    jwtPayload,
    config_default.JWT_ACCESS_SECRET,
    10 * 60 * 1e3
  );
  const resetUILink = `http://localhost:5000/reset-password?token=${token}`;
  SendMail_default(user?.email, `<p> ${resetUILink}</p>`);
};
var resetPassword = async (payload, token) => {
  const decoded = verifyToken(
    token,
    config_default.JWT_ACCESS_SECRET
  );
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ExistingUserError("User not found");
  }
  console.log("userId:", decoded.userId);
  console.log("new:pasowrd:", payload.newPassword);
  const newHashPassword = await hashPassword(payload.newPassword);
  await User.findByIdAndUpdate(decoded.userId, { password: newHashPassword });
  return {
    message: "Password reset successfully"
  };
};
var refreshtoken = async (token) => {
  if (!token) {
    throw new Error("Token not found.Unauthorized user!");
  }
  const decoded = verifyToken(token, config_default.JWT_REFRESH_SECRET);
  if (!decoded) {
    throw new Error("Could not verify token.");
  }
  const { userId } = decoded;
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not Found!");
  }
  const jwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };
  const accessToken = jwt2.sign(
    jwtPayload,
    config_default.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );
  return {
    accessToken
  };
};

// src/modules/auth/auth.controller.ts
var createUserInDB = async (req, res, next) => {
  try {
    const result = await createUser(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var loginUserInDB = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    const { refreshToken, accessToken } = result;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days milliseconds
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User logged in successfully",
      data: {
        token: accessToken,
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
};
var changePassword2 = async (req, res, next) => {
  try {
    console.log("user2:", req.user);
    console.log("user3:", req.body);
    const result = await changePassword(req.user, req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Password changed successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var forgetPassword2 = async (req, res, next) => {
  try {
    const result = await forgetPassword(req.body.email);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Please check your email",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var resetPassword2 = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const result = await resetPassword(req.body, token);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Password has been reset",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var refreshtoken2 = async (req, res, next) => {
  try {
    const result = await refreshtoken(req.cookies.refreshToken);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Token is refreshed successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var authController = { createUserInDB, loginUserInDB, changePassword: changePassword2, forgetPassword: forgetPassword2, resetPassword: resetPassword2, refreshtoken: refreshtoken2 };

// src/utility/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

// src/utility/validateRequest.ts
var validateRequest = (schema) => {
  return catchAsync(async (req, res, next) => {
    await schema.parseAsync({ body: req.body, cookies: req.cookies });
    return next();
  });
};
var validateRequest_default = validateRequest;

// src/modules/auth/auth.validation.ts
import { z as z2 } from "zod";
var changePasswordValidationSchema = z2.object({
  body: z2.object({
    oldPassword: z2.string().min(1, { message: "Old password is required" }),
    newPassword: z2.string().min(1, { message: "New password is required" })
  })
});
var refreshTokenValidationSchema = z2.object({
  cookies: z2.object({
    refreshToken: z2.string().min(1, { message: "Refresh Token is required" })
  })
});
var forgetPasswordValidationSchema = z2.object({
  body: z2.object({
    email: z2.email({ message: "Valid email is required" })
  })
});
var resetPasswordValidationSchema = z2.object({
  body: z2.object({
    newPassword: z2.string().min(1, { message: "Password is required" })
  })
});
var AuthValidations = {
  changePasswordValidationSchema,
  refreshTokenValidationSchema,
  forgetPasswordValidationSchema,
  resetPasswordValidationSchema
};

// src/middleware/authMiddleware.ts
import jwt3 from "jsonwebtoken";
var verifyToken2 = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  console.log("authHeader:", authHeader);
  console.log("token:", token);
  console.log("secret:", config_default.JWT_ACCESS_SECRET);
  if (!token) {
    return next(new UnauthorizedError("Authentication token is required"));
  }
  try {
    const decoded = jwt3.verify(token, config_default.JWT_ACCESS_SECRET);
    if (!decoded || !decoded.id || !decoded.role) {
      return next(new UnauthorizedError("Invalid token payload"));
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    return next();
  } catch (error) {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/login", authController.loginUserInDB);
router2.post("/signup", authController.createUserInDB);
router2.post("/change-password", verifyToken2, validateRequest_default(AuthValidations.changePasswordValidationSchema), authController.changePassword);
router2.post("/forget-password", validateRequest_default(AuthValidations.forgetPasswordValidationSchema), authController.forgetPassword);
router2.post("/reset-password", validateRequest_default(AuthValidations.resetPasswordValidationSchema), authController.resetPassword);
router2.post("/refresh-token", validateRequest_default(AuthValidations.refreshTokenValidationSchema), authController.refreshtoken);
var authRoutes = router2;

// src/modules/listings/listings.route.ts
import { Router as Router3 } from "express";

// src/modules/listings/listings.model.schema.ts
import { Schema as Schema2, model as model2 } from "mongoose";
var LocationSchema = new Schema2(
  {
    city: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, required: true }
  },
  { _id: false }
);
var PriceSchema = new Schema2(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true }
  },
  { _id: false }
);
var ReferralCommissionSchema = new Schema2(
  {
    offered_amount: { type: Number, required: true },
    confirmed_amount: { type: Number }
  },
  { _id: false }
);
var ListingSchema = new Schema2(
  {
    title: { type: String, required: true, trim: true },
    ref_code: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["active", "pending", "sold", "draft"],
      default: "draft"
    },
    location: { type: LocationSchema, required: true },
    price: { type: PriceSchema, required: true },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    area_sqm: { type: Number, required: true, min: 0 },
    referral_commission: { type: ReferralCommissionSchema, required: true },
    cover_image: { type: String, required: true },
    images: { type: [String], default: [] },
    associate_id: {
      type: Schema2.Types.ObjectId,
      ref: "User",
      required: true
    },
    promoters: {
      type: [Schema2.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);
ListingSchema.index({ status: 1 });
ListingSchema.index({ "location.country": 1 });
ListingSchema.index({ associate_id: 1 });
var Listing = model2("Listing", ListingSchema);

// src/modules/listings/listings.service.ts
var createListingInDB = async (payload) => {
  const listing = new Listing(payload);
  return await listing.save();
};
var getAllListingFromDB = async (query) => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query
  };
  const listingQuery = new queryBuilder_default(
    Listing.find().populate("associate_id", "name email"),
    queryWithDefaultSort
  ).search(["title", "ref_code"]).filter().sort().paginate().fieldsLimit();
  const data = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();
  const result = {
    data,
    meta
  };
  return result;
};
var getListingByIdFromDB = async (id) => {
  return await Listing.findById(id).populate("associate_id", "name email");
};
var getMyListingFromDB = async (associateId, query = {}) => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query
  };
  const listingQuery = new queryBuilder_default(
    Listing.find({ associate_id: associateId }),
    queryWithDefaultSort
  ).search(["title", "ref_code"]).filter().sort().paginate().fieldsLimit();
  const data = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();
  const result = {
    data,
    meta
  };
  return result;
};
var updateListingInDB = async (id, payload) => {
  return await Listing.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });
};
var deleteListingFromDB = async (id) => {
  return await Listing.findByIdAndDelete(id);
};
var listingsService = {
  createListingInDB,
  getAllListingFromDB,
  getListingByIdFromDB,
  updateListingInDB,
  deleteListingFromDB,
  getMyListingFromDB
};

// src/modules/listings/listings.controllers.ts
var createListing = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await listingsService.createListingInDB(payload);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Listing created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllListing = async (req, res, next) => {
  try {
    const query = req.query;
    const result = await listingsService.getAllListingFromDB(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Listing retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyListings = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const result = await listingsService.getMyListingFromDB(userId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Listing retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var listingController = {
  createListing,
  getAllListing,
  getMyListings
};

// src/modules/listings/listings.route.ts
var router3 = Router3();
router3.get("/", listingController.getAllListing);
router3.post("/", listingController.createListing);
router3.get("/my", verifyToken2, listingController.getMyListings);
var listingsRoutes = router3;

// src/modules/listingPromote/listing.promote.route.ts
import { Router as Router4 } from "express";

// src/modules/listingPromote/listings.promote.request.model.schema.ts
import { Schema as Schema3, model as model3 } from "mongoose";
var PromoteRequestSchema = new Schema3(
  {
    listing_id: {
      type: Schema3.Types.ObjectId,
      ref: "Listing",
      required: true
    },
    requester_id: {
      type: Schema3.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    requested_at: { type: Date, default: Date.now },
    resolved_at: { type: Date }
  },
  {
    timestamps: false
    // we manage requested_at / resolved_at manually
  }
);
PromoteRequestSchema.index(
  { listing_id: 1, requester_id: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
PromoteRequestSchema.index({ listing_id: 1, status: 1 });
PromoteRequestSchema.index({ requester_id: 1 });
PromoteRequestSchema.pre("save", function() {
  if (this.isModified("status") && this.status !== "pending") {
    this.resolved_at = this.resolved_at ?? /* @__PURE__ */ new Date();
  }
});
PromoteRequestSchema.post("save", async function(doc) {
  if (doc.status === "approved") {
    await Listing.findByIdAndUpdate(doc.listing_id, {
      $addToSet: { promoters: doc.requester_id }
    });
  } else if (doc.status === "rejected") {
    await Listing.findByIdAndUpdate(doc.listing_id, {
      $pull: { promoters: doc.requester_id }
    });
  }
});
var PromoteRequest = model3(
  "PromoteRequest",
  PromoteRequestSchema
);

// src/modules/listingPromote/listing.promote.service.ts
var createPromoteRequestInDB = async (payload) => {
  if (!payload.listing_id || !payload.requester_id) {
    throw new Error("listing_id and requester_id are required");
  }
  const listingId = payload.listing_id;
  const requesterId = payload.requester_id;
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }
  if (listing.associate_id.toString() === requesterId.toString()) {
    throw new Error("You cannot request to promote your own listing");
  }
  const existingPending = await PromoteRequest.findOne({
    listing_id: listingId,
    requester_id: requesterId,
    status: "pending"
  });
  if (existingPending) {
    throw new Error("You already have a pending request for this listing");
  }
  const promoteRequest = new PromoteRequest(payload);
  return await promoteRequest.save();
};
var getAllListingPromoteRequest = async (query) => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query
  };
  const promoteRequestQuery = new queryBuilder_default(
    PromoteRequest.find().populate("listing_id", "title ref_code cover_image").populate("requester_id", "name email"),
    queryWithDefaultSort
  ).search(["message"]).filter().sort().paginate().fieldsLimit();
  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
  return { data, meta };
};
var getMyListingsPromoteRequestFromDB = async (associateId, query) => {
  const myListingIds = await Listing.find({ associate_id: associateId }).distinct("_id");
  if (myListingIds.length === 0) {
    return { data: [], meta: { page: 1, limit: 10, total: 0, totalPage: 0 } };
  }
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query
  };
  const promoteRequestQuery = new queryBuilder_default(
    PromoteRequest.find({ listing_id: { $in: myListingIds } }).populate("listing_id", "title ref_code cover_image").populate("requester_id", "name email"),
    queryWithDefaultSort
  ).search(["message"]).filter().sort().paginate().fieldsLimit();
  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
  return { data, meta };
};
var manageListingPromoteRequestInDB = async (requestId, associateId, payload) => {
  const promoteRequest = await PromoteRequest.findById(requestId);
  if (!promoteRequest) {
    throw new Error("Promote request not found");
  }
  const listing = await Listing.findById(promoteRequest.listing_id);
  if (!listing) {
    throw new Error("Related listing not found");
  }
  if (listing.associate_id.toString() !== associateId.toString()) {
    throw new Error("You are not authorized to manage this promote request");
  }
  if (promoteRequest.status !== "pending") {
    throw new Error("This request has already been resolved");
  }
  promoteRequest.status = payload.status;
  if (payload.status === "approved") {
    promoteRequest.confirmed_commission_pct = payload.confirmed_commission_pct ?? promoteRequest.proposed_commission_pct;
  }
  return await promoteRequest.save();
};
var listingPromoteRequestService = {
  createPromoteRequestInDB,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequestFromDB,
  manageListingPromoteRequestInDB
};

// src/modules/listingPromote/listing.promote.controller.ts
var createListingPromoteRequest = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await listingPromoteRequestService.createPromoteRequestInDB(payload);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Listing Promote Request created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllListingPromoteRequest2 = async (req, res, next) => {
  try {
    const query = req.query;
    const result = await listingPromoteRequestService.getAllListingPromoteRequest(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Listing Promote Request retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyListingsPromoteRequest = async (req, res, next) => {
  try {
    const associate_id = req.user?.id;
    console.log(associate_id);
    const query = req.query;
    const result = await listingPromoteRequestService.getMyListingsPromoteRequestFromDB(associate_id, query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Sucessfully fatched your listings",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var manageListingPromoteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, confirmed_commission_pct } = req.body;
    const associateId = req.user?.id;
    console.log(id, associateId);
    if (!status || !["approved", "rejected"].includes(status)) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "status must be either 'approved' or 'rejected",
        data: null
      });
    }
    const result = await listingPromoteRequestService.manageListingPromoteRequestInDB(
      id,
      associateId,
      { status, confirmed_commission_pct }
    );
    res.status(200).json({
      success: true,
      message: `Promote request ${status} successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var listingPromoteRequestController = {
  createListingPromoteRequest,
  getAllListingPromoteRequest: getAllListingPromoteRequest2,
  getMyListingsPromoteRequest,
  manageListingPromoteRequest
};

// src/modules/listingPromote/listing.promote.route.ts
var router4 = Router4();
router4.get("/", listingPromoteRequestController.getAllListingPromoteRequest);
router4.post("/", listingPromoteRequestController.createListingPromoteRequest);
router4.post("/manage-request/:id", verifyToken2, listingPromoteRequestController.manageListingPromoteRequest);
router4.get("/mine", verifyToken2, listingPromoteRequestController.getMyListingsPromoteRequest);
var listingPromoteRequestRoutes = router4;

// src/routes/index.ts
var router5 = Router5();
var moduleRoutes = [
  {
    path: "/users",
    route: userRoutes
  },
  {
    path: "/auth",
    route: authRoutes
  },
  {
    path: "/listings",
    route: listingsRoutes
  },
  {
    path: "/listings/promote-request",
    route: listingPromoteRequestRoutes
  }
];
moduleRoutes.forEach((route) => {
  router5.use(route.path, route.route);
});
var routes_default = router5;

// src/app.ts
var app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Changed Bro!");
});
app.use("/api/v1", routes_default);
app.use(routeNotFoundHandler_default);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var port = process.env.PORT || 3e3;
var main = async () => {
  try {
    await mongoose.connect(config_default.MONGO_URI);
    app_default.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};
main();
//# sourceMappingURL=server.js.map