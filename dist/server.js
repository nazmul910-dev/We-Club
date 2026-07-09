
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/server.ts
import mongoose2 from "mongoose";

// src/app.ts
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

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
import { Router as Router11 } from "express";

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
var ACCESS_TO_OPTIONS = [
  "we_command_center",
  "invictus",
  "both"
];
var PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
  "expired"
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
var SUBSCRIPTION_STATUSES = [
  "none",
  "incomplete",
  "active",
  "past_due",
  "canceled",
  "expired"
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
    accessTo: {
      type: String,
      required: true,
      enum: ACCESS_TO_OPTIONS
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
      instagram: {
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
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid"
    },
    subscriptionStatus: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: "none"
    },
    stripeCustomerId: {
      type: String,
      trim: true
    },
    stripeSubscriptionId: {
      type: String,
      trim: true
    },
    stripeCheckoutSessionId: {
      type: String,
      trim: true
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
    approvalEmailSentAt: {
      type: Date
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
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || "NAZMUL Hasan",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY: process.env.STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY,
  STRIPE_PRICE_INVICTUS_MONTHLY: process.env.STRIPE_PRICE_INVICTUS_MONTHLY,
  STRIPE_PRICE_BOTH_MONTHLY: process.env.STRIPE_PRICE_BOTH_MONTHLY,
  STRIPE_PRICE_CEO_YEARLY: process.env.STRIPE_PRICE_CEO_YEARLY,
  STRIPE_PRICE_CEO_PARTNER_YEARLY: process.env.STRIPE_PRICE_CEO_PARTNER_YEARLY
};

// src/utility/errorResponses.ts
var NotFoundError = class extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.statusCode = 404;
    this.name = "NotFoundError";
  }
};
var ForbiddenError = class extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.statusCode = 403;
    this.name = "ForbiddenError";
  }
};
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
    accessTo: z.enum(["we_command_center", "invictus", "both"]),
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
    marketingChannels: z.array(z.string()).optional(),
    discountCode: z.string().trim().optional()
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

// src/modules/payment/payment.service.ts
import Stripe from "stripe";

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

// src/modules/payment/payment.model.schema.ts
import { Schema as Schema2, model as model2 } from "mongoose";

// src/modules/payment/payment.interface.ts
var PAYMENT_PURPOSES = ["registration", "upgrade"];
var PAYMENT_SESSION_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired"
];

// src/modules/payment/payment.model.schema.ts
var PaymentSessionSchema = new Schema2(
  {
    user: {
      type: Schema2.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true
    },
    accessTo: {
      type: String,
      enum: ACCESS_TO_OPTIONS,
      required: true
    },
    purpose: {
      type: String,
      enum: PAYMENT_PURPOSES,
      required: true
    },
    status: {
      type: String,
      enum: PAYMENT_SESSION_STATUSES,
      default: "pending",
      index: true
    },
    stripeCheckoutSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    stripeCustomerId: {
      type: String,
      trim: true
    },
    stripeSubscriptionId: {
      type: String,
      trim: true
    },
    checkoutUrl: {
      type: String,
      trim: true
    },
    amountTotal: {
      type: Number,
      min: 0
    },
    originalAmountTotal: {
      type: Number,
      min: 0
    },
    discountAmountTotal: {
      type: Number,
      min: 0
    },
    discountCode: {
      type: String,
      trim: true
    },
    discountPercent: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);
var PaymentSession = model2(
  "PaymentSession",
  PaymentSessionSchema
);

// src/modules/discount/discount.service.ts
import { Types } from "mongoose";

// src/utility/sendCustomMail.ts
import nodemailer3 from "nodemailer";
var sendCustomMail = async ({
  to,
  subject,
  html,
  text
}) => {
  const transporter = nodemailer3.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config_default.SMTP_AUTH_USER,
      pass: config_default.SMTP_AUTH_PASS
    }
  });
  await transporter.sendMail({
    from: `${config_default.MAIL_FROM_NAME} <${config_default.SMTP_AUTH_USER}>`,
    to,
    subject,
    text: text || "",
    html
  });
};
var sendCustomMail_default = sendCustomMail;

// src/utility/sendDiscountCodeMail.ts
var sendDiscountCodeMail = async ({
  email,
  code,
  discountPercent,
  expiresAt
}) => {
  const expiryText = expiresAt ? `This code will expire on ${expiresAt.toDateString()}.` : "This code is valid while the offer is active.";
  await sendCustomMail_default({
    to: email,
    subject: "Your World Elite Discount Code",
    text: `Your World Elite discount code is ${code}. Discount: ${discountPercent}%. ${expiryText}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:30px; border-radius:12px;">
          <h2 style="margin:0 0 15px; color:#111827;">Your World Elite Discount Code</h2>

          <p style="font-size:15px; color:#374151;">
            Use this discount code during registration or subscription upgrade.
          </p>

          <div style="margin:25px 0; padding:18px; background:#111827; color:#ffffff; text-align:center; border-radius:10px;">
            <p style="margin:0 0 8px; font-size:13px;">Discount Code</p>
            <h1 style="margin:0; letter-spacing:2px;">${code}</h1>
          </div>

          <p style="font-size:16px; color:#111827;">
            Discount: <strong>${discountPercent}%</strong>
          </p>

          <p style="font-size:14px; color:#6b7280;">
            ${expiryText}
          </p>

          <p style="font-size:14px; color:#6b7280; margin-top:25px;">
            Thank you,<br />
            World Elite Team
          </p>
        </div>
      </div>
    `
  });
};

// src/modules/discount/discount.model.schema.ts
import { Schema as Schema3, model as model3 } from "mongoose";
var DiscountCodeSchema = new Schema3(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    allowedRoles: [
      {
        type: String,
        enum: USER_ROLES
      }
    ],
    allowedAccessTo: [
      {
        type: String,
        enum: ACCESS_TO_OPTIONS
      }
    ],
    maxRedemptionsPerRole: {
      type: Number,
      default: 20,
      min: 1
    },
    expiresAt: {
      type: Date
    },
    createdBy: {
      type: Schema3.Types.ObjectId,
      ref: "User"
    },
    note: {
      type: String,
      trim: true
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);
var DiscountRedemptionSchema = new Schema3(
  {
    discountCode: {
      type: Schema3.Types.ObjectId,
      ref: "DiscountCode",
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    user: {
      type: Schema3.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true
    },
    accessTo: {
      type: String,
      enum: ACCESS_TO_OPTIONS,
      required: true
    },
    stripeCheckoutSessionId: {
      type: String,
      required: true,
      index: true
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);
DiscountRedemptionSchema.index(
  {
    discountCode: 1,
    user: 1
  },
  {
    unique: true
  }
);
var DiscountCode = model3(
  "DiscountCode",
  DiscountCodeSchema
);
var DiscountRedemption = model3(
  "DiscountRedemption",
  DiscountRedemptionSchema
);

// src/modules/discount/discount.service.ts
var throwError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var normalizeCode = (code) => {
  return code.trim().toUpperCase();
};
var createDiscountCodeIntoDB = async (payload, adminId) => {
  const code = normalizeCode(payload.code);
  const existing = await DiscountCode.findOne({ code });
  if (existing) {
    throwError("Discount code already exists", 409);
  }
  const createPayload = {
    code,
    discountPercent: payload.discountPercent,
    maxRedemptionsPerRole: payload.maxRedemptionsPerRole ?? 20,
    isActive: true
  };
  if (payload.allowedRoles !== void 0) {
    createPayload.allowedRoles = payload.allowedRoles;
  }
  if (payload.allowedAccessTo !== void 0) {
    createPayload.allowedAccessTo = payload.allowedAccessTo;
  }
  if (payload.expiresAt !== void 0) {
    createPayload.expiresAt = new Date(payload.expiresAt);
  }
  if (payload.note !== void 0) {
    createPayload.note = payload.note;
  }
  if (adminId) {
    createPayload.createdBy = new Types.ObjectId(adminId);
  }
  return DiscountCode.create(createPayload);
};
var getAllDiscountCodesFromDB = async () => {
  return DiscountCode.find().sort({ createdAt: -1 });
};
var validateDiscountCodeForCheckout = async ({
  code,
  role,
  accessTo,
  userId
}) => {
  if (!code) {
    return null;
  }
  const normalizedCode = normalizeCode(code);
  const discount = await DiscountCode.findOne({
    code: normalizedCode
  });
  if (!discount) {
    throwError("Invalid discount code", 400);
  }
  const discountCode = discount;
  if (!discountCode.isActive) {
    throwError("Discount code is inactive", 400);
  }
  if (discountCode.expiresAt && discountCode.expiresAt < /* @__PURE__ */ new Date()) {
    throwError("Discount code has expired", 400);
  }
  if (discountCode.allowedRoles && discountCode.allowedRoles.length > 0 && !discountCode.allowedRoles.includes(role)) {
    throwError("This discount code is not valid for this role", 400);
  }
  if (discountCode.allowedAccessTo && discountCode.allowedAccessTo.length > 0 && !discountCode.allowedAccessTo.includes(accessTo)) {
    throwError("This discount code is not valid for this access type", 400);
  }
  const usedForRole = await DiscountRedemption.countDocuments({
    discountCode: discountCode._id,
    role
  });
  if (usedForRole >= discountCode.maxRedemptionsPerRole) {
    throwError("Discount code redemption limit reached for this role", 400);
  }
  if (userId) {
    const alreadyUsedByUser = await DiscountRedemption.findOne({
      discountCode: discountCode._id,
      user: userId
    });
    if (alreadyUsedByUser) {
      throwError("You have already used this discount code", 400);
    }
  }
  return {
    discountId: discountCode._id,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent
  };
};
var redeemDiscountCodeAfterPayment = async ({
  code,
  userId,
  role,
  accessTo,
  stripeCheckoutSessionId
}) => {
  if (!code) {
    return null;
  }
  const normalizedCode = normalizeCode(code);
  const discount = await DiscountCode.findOne({
    code: normalizedCode
  });
  if (!discount) {
    return null;
  }
  const existing = await DiscountRedemption.findOne({
    discountCode: discount._id,
    user: userId
  });
  if (existing) {
    return existing;
  }
  const redemption = await DiscountRedemption.create({
    discountCode: discount._id,
    code: discount.code,
    user: userId,
    role,
    accessTo,
    stripeCheckoutSessionId,
    redeemedAt: /* @__PURE__ */ new Date()
  });
  await DiscountCode.findByIdAndUpdate(discount._id, {
    $inc: {
      usedCount: 1
    }
  });
  return redemption;
};
var sendDiscountCodeByEmail = async (email, code) => {
  const discount = await DiscountCode.findOne({
    code: normalizeCode(code),
    isActive: true
  });
  if (!discount) {
    throwError("Discount code not found or inactive", 404);
  }
  const discountCode = discount;
  await sendDiscountCodeMail({
    email,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    expiresAt: discountCode.expiresAt
  });
  return {
    email,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    message: "Discount code email sent successfully"
  };
};
var discountService = {
  createDiscountCodeIntoDB,
  getAllDiscountCodesFromDB,
  validateDiscountCodeForCheckout,
  redeemDiscountCodeAfterPayment,
  sendDiscountCodeByEmail
};

// src/modules/payment/payment.pricing.ts
var parseDollarAmountToCents = (value, envKey) => {
  if (!value) {
    throw new Error(`${envKey} is missing in environment variables`);
  }
  const amount = Number(value);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`${envKey} must be a valid positive number`);
  }
  return Math.round(amount * 100);
};
var formatAmount = (amountCents) => {
  return `$${(amountCents / 100).toFixed(2)}`;
};
var createPricingItem = ({
  name,
  description,
  amountCents,
  interval
}) => {
  const formattedAmount = formatAmount(amountCents);
  return {
    name,
    description,
    amountCents,
    amount: amountCents / 100,
    currency: "usd",
    interval,
    formattedAmount,
    billingText: interval === "month" ? `${formattedAmount} / month` : `${formattedAmount} / year`
  };
};
var isPaidRole = (role) => {
  return [
    "associate",
    "partner",
    "ambassador",
    "ceo",
    "ceo_partner"
  ].includes(role);
};
var getMemberAccessPrice = (accessTo) => {
  if (accessTo === "we_command_center") {
    return parseDollarAmountToCents(
      config_default.STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY,
      "STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY"
    );
  }
  if (accessTo === "invictus") {
    return parseDollarAmountToCents(
      config_default.STRIPE_PRICE_INVICTUS_MONTHLY,
      "STRIPE_PRICE_INVICTUS_MONTHLY"
    );
  }
  return parseDollarAmountToCents(
    config_default.STRIPE_PRICE_BOTH_MONTHLY,
    "STRIPE_PRICE_BOTH_MONTHLY"
  );
};
var getAccessDisplayName = (accessTo) => {
  if (accessTo === "we_command_center") {
    return "W\xC9 Command Center";
  }
  if (accessTo === "invictus") {
    return "INVICTUS Academy";
  }
  return "W\xC9 Command Center + INVICTUS Academy";
};
var getPricingByRoleAndAccess = (role, accessTo) => {
  let displayName = "";
  let items = [];
  const accessName = getAccessDisplayName(accessTo);
  if (["associate", "partner", "ambassador"].includes(role)) {
    displayName = `${role.toUpperCase()} - ${accessName}`;
    items = [
      createPricingItem({
        name: displayName,
        description: `Access to ${accessName}.`,
        amountCents: getMemberAccessPrice(accessTo),
        interval: "month"
      })
    ];
  }
  if (role === "ceo") {
    displayName = "CEO Club Membership";
    if (accessTo === "we_command_center") {
      items = [
        createPricingItem({
          name: "W\xC9 Command Center Access",
          description: "Access to W\xC9 Command Center.",
          amountCents: getMemberAccessPrice("we_command_center"),
          interval: "month"
        })
      ];
    } else {
      items = [
        createPricingItem({
          name: "CEO Club Membership",
          description: "INVICTUS Academy Accountability, courses, online events and content creation.",
          amountCents: parseDollarAmountToCents(
            config_default.STRIPE_PRICE_CEO_YEARLY,
            "STRIPE_PRICE_CEO_YEARLY"
          ),
          interval: "year"
        })
      ];
      if (accessTo === "both") {
        items.push(
          createPricingItem({
            name: "W\xC9 Command Center Access",
            description: "Access to W\xC9 Command Center.",
            amountCents: getMemberAccessPrice("we_command_center"),
            interval: "month"
          })
        );
      }
    }
  }
  if (role === "ceo_partner") {
    displayName = "CEO Partner Membership";
    if (accessTo === "we_command_center") {
      items = [
        createPricingItem({
          name: "W\xC9 Command Center Access",
          description: "Access to W\xC9 Command Center.",
          amountCents: getMemberAccessPrice("we_command_center"),
          interval: "month"
        })
      ];
    } else {
      items = [
        createPricingItem({
          name: "CEO Partner Yearly Membership",
          description: "Annual CEO Partner access.",
          amountCents: parseDollarAmountToCents(
            config_default.STRIPE_PRICE_CEO_PARTNER_YEARLY,
            "STRIPE_PRICE_CEO_PARTNER_YEARLY"
          ),
          interval: "year"
        })
      ];
      if (accessTo === "both") {
        items.push(
          createPricingItem({
            name: "W\xC9 Command Center Access",
            description: "Access to W\xC9 Command Center.",
            amountCents: getMemberAccessPrice("we_command_center"),
            interval: "month"
          })
        );
      }
    }
  }
  const totalFirstPaymentCents = items.reduce(
    (total, item) => total + item.amountCents,
    0
  );
  return {
    role,
    accessTo,
    displayName,
    requiresPayment: items.length > 0,
    items,
    totalFirstPaymentCents,
    totalFirstPayment: totalFirstPaymentCents / 100,
    totalFirstPaymentFormatted: formatAmount(totalFirstPaymentCents)
  };
};
var applyDiscountToPricingPlan = (pricingPlan, discountPercent) => {
  if (discountPercent <= 0) {
    return pricingPlan;
  }
  const discountedItems = pricingPlan.items.map((item) => {
    const discountedAmountCents = Math.max(
      50,
      Math.round(item.amountCents * ((100 - discountPercent) / 100))
    );
    return {
      ...item,
      amountCents: discountedAmountCents,
      amount: discountedAmountCents / 100,
      formattedAmount: formatAmount(discountedAmountCents),
      billingText: item.interval === "month" ? `${formatAmount(discountedAmountCents)} / month` : `${formatAmount(discountedAmountCents)} / year`
    };
  });
  const totalFirstPaymentCents = discountedItems.reduce(
    (total, item) => total + item.amountCents,
    0
  );
  return {
    ...pricingPlan,
    items: discountedItems,
    totalFirstPaymentCents,
    totalFirstPayment: totalFirstPaymentCents / 100,
    totalFirstPaymentFormatted: formatAmount(totalFirstPaymentCents)
  };
};
var getAllPricingPlans = () => {
  const roles = [
    "associate",
    "partner",
    "ambassador",
    "ceo",
    "ceo_partner"
  ];
  const accessList = [
    "we_command_center",
    "invictus",
    "both"
  ];
  return roles.flatMap(
    (role) => accessList.map(
      (accessTo) => getPricingByRoleAndAccess(role, accessTo)
    )
  );
};

// src/modules/payment/payment.service.ts
var stripeSecretKey = config_default.STRIPE_SECRET_KEY;
var stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
var stripUndefined = (obj) => {
  const result = {};
  for (const key in obj) {
    if (obj[key] !== void 0) {
      result[key] = obj[key];
    }
  }
  return result;
};
var throwError2 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var getStripeClient = () => {
  const stripeClient = stripe;
  if (!stripeClient) {
    throwError2("Stripe is not configured. Please set STRIPE_SECRET_KEY.", 500);
  }
  return stripeClient;
};
var getPricingPlanByRoleAndAccess = (role, accessTo) => {
  return getPricingByRoleAndAccess(role, accessTo);
};
var createCheckoutSession = async ({
  userId,
  fullName,
  email,
  role,
  accessTo,
  purpose,
  discountCode,
  stripeCustomerId
}) => {
  if (!isPaidRole(role)) {
    throwError2("This role does not require Stripe payment", 400);
  }
  const originalPricingPlan = getPricingByRoleAndAccess(role, accessTo);
  if (!originalPricingPlan.requiresPayment || originalPricingPlan.items.length === 0) {
    throwError2("No pricing configured for this role and access type", 500);
  }
  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,
    role,
    accessTo,
    userId
  });
  const finalPricingPlan = discount ? applyDiscountToPricingPlan(
    originalPricingPlan,
    discount.discountPercent
  ) : originalPricingPlan;
  const sessionCreateParams = {
    mode: "subscription",
    line_items: finalPricingPlan.items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: item.currency,
        unit_amount: item.amountCents,
        recurring: {
          interval: item.interval
        },
        product_data: {
          name: item.name,
          description: item.description
        }
      }
    })),
    allow_promotion_codes: false,
    success_url: `${config_default.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config_default.FRONTEND_URL}/payment/cancel`,
    metadata: {
      userId,
      role,
      accessTo,
      purpose,
      fullName,
      email,
      originalAmountCents: String(
        originalPricingPlan.totalFirstPaymentCents
      ),
      finalAmountCents: String(
        finalPricingPlan.totalFirstPaymentCents
      ),
      discountCode: discount?.code || "",
      discountPercent: String(discount?.discountPercent || 0)
    },
    subscription_data: {
      metadata: {
        userId,
        role,
        accessTo,
        purpose,
        discountCode: discount?.code || "",
        discountPercent: String(discount?.discountPercent || 0)
      }
    }
  };
  if (stripeCustomerId) {
    sessionCreateParams.customer = stripeCustomerId;
  } else {
    sessionCreateParams.customer_email = email;
  }
  const stripeClient = getStripeClient();
  const session = await stripeClient.checkout.sessions.create(sessionCreateParams);
  if (!session.url) {
    throwError2("Failed to create Stripe Checkout session", 500);
  }
  await PaymentSession.create(
    stripUndefined({
      user: userId,
      role,
      accessTo,
      purpose,
      status: "pending",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : void 0,
      checkoutUrl: session.url ?? void 0,
      amountTotal: finalPricingPlan.totalFirstPaymentCents,
      originalAmountTotal: originalPricingPlan.totalFirstPaymentCents,
      discountAmountTotal: originalPricingPlan.totalFirstPaymentCents - finalPricingPlan.totalFirstPaymentCents,
      discountCode: discount?.code,
      discountPercent: discount?.discountPercent,
      currency: "usd"
    })
  );
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        stripeCheckoutSessionId: session.id,
        subscriptionStatus: "incomplete"
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
  return {
    checkoutUrl: session.url ?? null,
    sessionId: session.id,
    pricing: finalPricingPlan,
    originalPricing: originalPricingPlan,
    discount
  };
};
var createUpgradeCheckoutSessionIntoStripe = async (userId, discountCode) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throwError2("User not found", 404);
  }
  return createCheckoutSession({
    userId: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    accessTo: user.accessTo,
    purpose: "upgrade",
    discountCode,
    stripeCustomerId: user.stripeCustomerId
  });
};
var getSubscriptionPeriodEnd = (subscription) => {
  const subscriptionWithPeriod = subscription;
  if (!subscriptionWithPeriod.current_period_end) {
    return void 0;
  }
  return new Date(subscriptionWithPeriod.current_period_end * 1e3);
};
var activateUserSubscription = async (session) => {
  const userId = session.metadata?.userId;
  const role = session.metadata?.role;
  const accessTo = session.metadata?.accessTo;
  const purpose = session.metadata?.purpose;
  const discountCode = session.metadata?.discountCode || void 0;
  if (!userId || !role || !accessTo || !purpose) {
    throwError2("Stripe session metadata is missing", 400);
  }
  const userIdVal = userId;
  const roleVal = role;
  const accessToVal = accessTo;
  const purposeVal = purpose;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  let subscriptionExpiresAt;
  const stripeClient = getStripeClient();
  if (subscriptionId) {
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
    subscriptionExpiresAt = getSubscriptionPeriodEnd(subscription);
  }
  const userSetPayload = {
    paymentStatus: "paid",
    subscriptionStatus: "active",
    accessTo: accessToVal,
    stripeCheckoutSessionId: session.id,
    subscriptionStartAt: /* @__PURE__ */ new Date()
  };
  if (customerId) {
    userSetPayload.stripeCustomerId = customerId;
  }
  if (subscriptionId) {
    userSetPayload.stripeSubscriptionId = subscriptionId;
  }
  if (subscriptionExpiresAt) {
    userSetPayload.subscriptionExpiresAt = subscriptionExpiresAt;
  }
  if (purposeVal === "registration") {
    userSetPayload.accountStatus = "pending_approval";
  }
  const user = await User.findByIdAndUpdate(
    userIdVal,
    {
      $set: userSetPayload
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password");
  if (!user) {
    throwError2("User not found while activating subscription", 404);
  }
  const currentUser = user;
  const paymentSetPayload = {
    status: "paid",
    amountTotal: session.amount_total || Number(session.metadata?.finalAmountCents) || Number(session.metadata?.totalFirstPaymentCents) || void 0,
    originalAmountTotal: Number(session.metadata?.originalAmountCents) || void 0,
    discountAmountTotal: Number(session.metadata?.originalAmountCents || 0) - Number(session.metadata?.finalAmountCents || 0) || void 0,
    discountCode: discountCode || void 0,
    discountPercent: Number(session.metadata?.discountPercent) || void 0,
    currency: session.currency || "usd"
  };
  if (customerId) {
    paymentSetPayload.stripeCustomerId = customerId;
  }
  if (subscriptionId) {
    paymentSetPayload.stripeSubscriptionId = subscriptionId;
  }
  await PaymentSession.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id
    },
    {
      $set: paymentSetPayload
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
  if (discountCode) {
    await discountService.redeemDiscountCodeAfterPayment({
      code: discountCode,
      userId: userIdVal,
      role: roleVal,
      accessTo: accessToVal,
      stripeCheckoutSessionId: session.id
    });
  }
  if (purposeVal === "registration") {
    try {
      await sendCalendlyMeetingMail({
        fullName: currentUser.fullName,
        email: currentUser.email,
        role: currentUser.role
      });
    } catch (error) {
      console.error(
        "Calendly meeting email failed:",
        error instanceof Error ? error.message : error
      );
    }
  }
  return user;
};
var handleCheckoutSessionCompleted = async (session) => {
  const existingPayment = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id
  });
  if (existingPayment?.status === "paid") {
    return;
  }
  await activateUserSubscription(session);
};
var getInvoiceSubscriptionId = (invoice) => {
  const invoiceWithSubscription = invoice;
  if (typeof invoiceWithSubscription.subscription === "string") {
    return invoiceWithSubscription.subscription;
  }
  return invoiceWithSubscription.subscription?.id;
};
var getInvoiceCustomerId = (invoice) => {
  if (typeof invoice.customer === "string") {
    return invoice.customer;
  }
  return invoice.customer?.id;
};
var handleInvoicePaid = async (invoice) => {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId = getInvoiceCustomerId(invoice);
  if (!subscriptionId) {
    return;
  }
  const stripeClient = getStripeClient();
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  const subscriptionExpiresAt = getSubscriptionPeriodEnd(subscription);
  const setPayload = {
    paymentStatus: "paid",
    subscriptionStatus: "active",
    stripeSubscriptionId: subscriptionId
  };
  if (customerId) {
    setPayload.stripeCustomerId = customerId;
  }
  if (subscriptionExpiresAt) {
    setPayload.subscriptionExpiresAt = subscriptionExpiresAt;
  }
  await User.findOneAndUpdate(
    {
      $or: [
        { stripeSubscriptionId: subscriptionId },
        ...customerId ? [{ stripeCustomerId: customerId }] : []
      ]
    },
    {
      $set: setPayload
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
};
var handleInvoicePaymentFailed = async (invoice) => {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return;
  }
  await User.findOneAndUpdate(
    {
      stripeSubscriptionId: subscriptionId
    },
    {
      $set: {
        paymentStatus: "failed",
        subscriptionStatus: "past_due"
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
};
var handleSubscriptionDeletedOrExpired = async (subscription) => {
  await User.findOneAndUpdate(
    {
      stripeSubscriptionId: subscription.id
    },
    {
      $set: {
        paymentStatus: "expired",
        subscriptionStatus: "expired",
        subscriptionExpiresAt: /* @__PURE__ */ new Date()
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
};
var handleStripeWebhook = async (rawBody, signature) => {
  const stripeSignatureValue = Array.isArray(signature) ? signature[0] : signature;
  if (typeof stripeSignatureValue !== "string" || !stripeSignatureValue.trim()) {
    throwError2("Stripe signature is missing", 400);
  }
  const stripeSignature = stripeSignatureValue;
  const webhookSecret = config_default.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throwError2("Stripe webhook secret is missing", 500);
  }
  const stripeClient = getStripeClient();
  const stripeWebhookSecret = webhookSecret;
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      stripeWebhookSecret
    );
  } catch {
    throwError2("Invalid Stripe webhook signature", 400);
  }
  if (!event) {
    throwError2("Unable to process Stripe webhook event", 500);
  }
  const webhookEvent = event;
  switch (webhookEvent.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        webhookEvent.data.object
      );
      break;
    case "invoice.paid":
      await handleInvoicePaid(webhookEvent.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(webhookEvent.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeletedOrExpired(
        webhookEvent.data.object
      );
      break;
    default:
      break;
  }
};
var verifyCheckoutSessionFromStripe = async (sessionId) => {
  const stripeClient = getStripeClient();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return {
      paid: false,
      message: "Payment is not completed yet"
    };
  }
  await activateUserSubscription(session);
  return {
    paid: true,
    message: "Payment verified successfully"
  };
};
var paymentService = {
  getAllPricingPlans,
  getPricingPlanByRoleAndAccess,
  createCheckoutSession,
  createUpgradeCheckoutSessionIntoStripe,
  handleStripeWebhook,
  verifyCheckoutSessionFromStripe
};

// src/modules/auth/auth.service.ts
var createUser = async (payload) => {
  const { body } = registerValidation.parse({ body: payload });
  const existingUser = await User.findOne({ email: body.email });
  if (existingUser) {
    throw new ExistingUserError("User already exists");
  }
  const hashedPassword = await hashPassword(body.password);
  const requiresPayment = isPaidRole(body.role);
  const userPayload = {
    fullName: body.fullName,
    email: body.email,
    role: body.role,
    accessTo: body.accessTo,
    password: hashedPassword,
    paymentStatus: requiresPayment ? "unpaid" : "paid",
    subscriptionStatus: requiresPayment ? "none" : "active",
    approvalStatus: "pending",
    accountStatus: requiresPayment ? "pending_payment" : "pending_approval",
    licenseVerificationStatus: "pending"
  };
  if (body.licenseNumber !== void 0) {
    userPayload.licenseNumber = body.licenseNumber;
  }
  if (body.brokerage !== void 0) {
    userPayload.brokerage = body.brokerage;
  }
  if (body.phone !== void 0) {
    userPayload.phone = body.phone;
  }
  if (body.city !== void 0) {
    userPayload.city = body.city;
  }
  if (body.country !== void 0) {
    userPayload.country = body.country;
  }
  if (body.bio !== void 0) {
    userPayload.bio = body.bio;
  }
  if (body.marketingChannels !== void 0) {
    userPayload.marketingChannels = body.marketingChannels;
  }
  if (body.socialLinks !== void 0) {
    userPayload.socialLinks = body.socialLinks;
  }
  const user = await User.create(
    userPayload
  );
  const userObject = user.toObject();
  const { password: _password, ...safeUserObject } = userObject;
  if (!requiresPayment) {
    return {
      user: safeUserObject,
      checkoutUrl: null,
      sessionId: null,
      pricing: null,
      message: "User created successfully. Waiting for admin approval."
    };
  }
  try {
    const checkout = await paymentService.createCheckoutSession({
      userId: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessTo: user.accessTo,
      purpose: "registration",
      discountCode: body.discountCode
    });
    return {
      user: safeUserObject,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
      pricing: checkout.pricing,
      originalPricing: checkout.originalPricing,
      discount: checkout.discount,
      message: "User created. Please complete payment to continue registration."
    };
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
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
    role: user.role,
    accessTo: user.accessTo
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
      role: user.role,
      accessTo: user.accessTo
    },
    config_default.JWT_REFRESH_SECRET,
    7 * 24 * 60 * 60
  );
  const userObject = user.toObject();
  const { password: _password, ...safeUserObject } = userObject;
  return {
    accessToken,
    refreshToken,
    user: safeUserObject
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
  const resetUILink = `http://localhost:3000/reset-password?token=${token}`;
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
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
      throw new Error("Token missing");
    }
    const result = await resetPassword(
      req.body,
      token
    );
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
      role: decoded.role,
      accessTo: decoded.accessTo
    };
    return next();
  } catch (error) {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};
var verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }
  if (req.user.role !== "admin") {
    return next(
      new ForbiddenError("You are not authorized to access this resource")
    );
  }
  return next();
};
var authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("Authentication required"));
    }
    if (!allowedRoles.includes(user.role)) {
      return next(new ForbiddenError("Access denied: insufficient role"));
    }
    return next();
  };
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
import { Schema as Schema4, model as model4 } from "mongoose";
var LocationSchema = new Schema4(
  {
    city: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, required: true }
  },
  { _id: false }
);
var PriceSchema = new Schema4(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true }
  },
  { _id: false }
);
var ReferralCommissionSchema = new Schema4(
  {
    offered_amount: { type: Number, required: true },
    confirmed_amount: { type: Number }
  },
  { _id: false }
);
var ListingSchema = new Schema4(
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
      type: Schema4.Types.ObjectId,
      ref: "User",
      required: true
    },
    promoters: {
      type: [{
        _id: false,
        user_id: { type: Schema4.Types.ObjectId, ref: "User" },
        tier: { type: String, enum: ["tier_1", "tier_2", "tier_3"] }
      }],
      default: []
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    deleted_at: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);
ListingSchema.index({ status: 1 });
ListingSchema.index({ "location.country": 1 });
ListingSchema.index({ associate_id: 1 });
ListingSchema.index({ is_deleted: 1 });
ListingSchema.pre(/^find/, function() {
  if (this.getFilter().is_deleted === void 0) {
    this.where({ is_deleted: false });
  }
});
var Listing = model4("Listing", ListingSchema);

// src/modules/listingPromote/listings.promote.request.model.schema.ts
import { Schema as Schema5, model as model5 } from "mongoose";
var PromoteRequestSchema = new Schema5(
  {
    listing_id: {
      type: Schema5.Types.ObjectId,
      ref: "Listing",
      required: true
    },
    requester: {
      user_id: {
        type: Schema5.Types.ObjectId,
        ref: "User",
        required: true
      },
      email: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending"
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    selected_tier: {
      type: String,
      enum: ["tier_1", "tier_2", "tier_3"],
      default: null
      // null যতক্ষণ approve না হয়
    },
    deleted_at: Date,
    requested_at: { type: Date, default: Date.now },
    resolved_at: { type: Date }
  },
  {
    timestamps: false
    // we manage requested_at / resolved_at manually
  }
);
PromoteRequestSchema.pre(/^find/, function() {
  if (this.getFilter().is_deleted === void 0) {
    this.where({ is_deleted: false });
  }
});
PromoteRequestSchema.index(
  { listing_id: 1, "requester.user_id": 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
PromoteRequestSchema.index({ listing_id: 1, status: 1 });
PromoteRequestSchema.index({ "requester.user_id": 1 });
PromoteRequestSchema.index({ listing_id: 1, status: 1 });
PromoteRequestSchema.index({ "requester.user_id": 1 });
PromoteRequestSchema.pre("save", function() {
  if (this.isModified("status") && this.status !== "pending") {
    this.resolved_at = this.resolved_at ?? /* @__PURE__ */ new Date();
  }
});
PromoteRequestSchema.post("save", async function(doc) {
  if (doc.status === "approved") {
    await Listing.findByIdAndUpdate(doc.listing_id, {
      $addToSet: {
        promoters: {
          user_id: doc.requester.user_id,
          tier: doc.selected_tier
        }
      }
    });
  } else if (doc.status === "rejected") {
    await Listing.findByIdAndUpdate(doc.listing_id, {
      $pull: {
        promoters: { user_id: doc.requester.user_id }
      }
    });
  }
});
var PromoteRequest = model5(
  "PromoteRequest",
  PromoteRequestSchema
);

// src/modules/listings/listings.service.ts
import mongoose from "mongoose";
var createListingInDB = async (payload) => {
  console.log("payload ", payload);
  const listing = new Listing(payload);
  return await listing.save();
};
var getAllListingFromDB = async (query) => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query
  };
  const listingQuery = new queryBuilder_default(
    Listing.find().populate("associate_id", "fullName email phone city country brokerage profileImage accountStatus role"),
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
var getMyListingFromDB = async (associateId, query = {}) => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query
  };
  console.log("query", queryWithDefaultSort);
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
var getListingByIdFromDB = async (id) => {
  return await Listing.findById(id).populate("associate_id", "name email");
};
var getMyPromotersFromDB = async (associateId) => {
  const result = await Listing.aggregate([
    // 1. Only this associate's listings, not soft-deleted
    {
      $match: {
        associate_id: new mongoose.Types.ObjectId(associateId),
        is_deleted: false
      }
    },
    // 2. Flatten promoters array — one doc per promoter per listing
    { $unwind: "$promoters" },
    // 3. Group by promoter user_id
    //    - count how many listings they're promoting
    //    - collect each listing's price (amount + currency) to handle multi-currency
    {
      $group: {
        _id: "$promoters.user_id",
        tier: { $last: "$promoters.tier" },
        totalListingsCount: { $sum: 1 },
        listingPrices: {
          $push: {
            amount: "$price.amount",
            currency: "$price.currency"
          }
        }
      }
    },
    // 4. Lookup User details — one join, not N queries
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { fullName: 1, email: 1, phone: 1, _id: 0 } }]
      }
    },
    // 5. Flatten the user array (lookup always returns array)
    { $unwind: "$user" },
    // 6. Shape final output
    {
      $project: {
        _id: 0,
        user_id: "$_id",
        name: "$user.fullName",
        email: "$user.email",
        phone: "$user.phone",
        tier: 1,
        totalListingsCount: 1,
        listingPrices: 1
      }
    },
    { $sort: { totalListingsCount: -1 } }
  ]);
  return result;
};
var updateListingInDB = async (id, associateId, payload) => {
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }
  const isOwner = listing.associate_id.toString() !== associateId.toString();
  if (!isOwner) {
    throw new UnauthorizedError(
      "You are not authorized to update this listing"
    );
  }
  const { promoters, associate_id, ...safePayload } = payload;
  return await Listing.findByIdAndUpdate(id, safePayload, {
    new: true,
    runValidators: true
  });
};
var deleteListingFromDB = async (id, userId, role) => {
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new Error("Listing not found");
  }
  const isOwner = listing.associate_id.toString() === userId.toString();
  const isAdmin = role === "admin";
  if (!isOwner && !isAdmin) {
    throw new UnauthorizedError(
      "You are not authorized to delete this listing"
    );
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    listing.is_deleted = true;
    listing.deleted_at = /* @__PURE__ */ new Date();
    await listing.save({ session });
    await PromoteRequest.updateMany(
      { listing_id: id, is_deleted: false },
      { is_deleted: true, deleted_at: /* @__PURE__ */ new Date() },
      { session }
    );
    await session.commitTransaction();
    return listing;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
var cancelPendingListingInDB = async (id, userId) => {
  const listing = await Listing.findById(id);
  console.log(userId);
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }
  const isOwner = listing.associate_id.toString() === userId.toString();
  if (!isOwner) {
    throw new UnauthorizedError(
      "You are not authorized to cancel this listing"
    );
  }
  listing.status = "draft";
  return await listing.save();
};
var deletePendingListingInDB = async (id, userId) => {
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }
  const isOwner = listing.associate_id.toString() === userId.toString();
  if (!isOwner) {
    throw new UnauthorizedError(
      "You are not authorized to delete this listing"
    );
  }
  listing.is_deleted = true;
  listing.deleted_at = /* @__PURE__ */ new Date();
  return await listing.save();
};
var manageListings = async (id, status) => {
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }
  listing.status = status;
  return await listing.save();
};
var listingsService = {
  createListingInDB,
  getAllListingFromDB,
  getListingByIdFromDB,
  updateListingInDB,
  deleteListingFromDB,
  getMyListingFromDB,
  getMyPromotersFromDB,
  cancelPendingListingInDB,
  deletePendingListingInDB,
  manageListings
};

// src/utility/cloudinaryUpload.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: config_default.CLOUDINARY_CLOUD_NAME,
  api_key: config_default.CLOUDINARY_API_KEY,
  api_secret: config_default.CLOUDINARY_API_SECRET
});
var uploadImageToCloudinary = async (file, folder = "newaza/profile-images") => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;
  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "image",
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        fetch_format: "auto"
      }
    ]
  });
  return result.secure_url;
};

// src/utility/parseIfString.ts
var parseIfString = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

// src/modules/listings/listings.controllers.ts
var createListing = async (req, res) => {
  try {
    const files = req.files;
    const [cover_image, ...uploadedImages] = await Promise.all([
      files?.cover_image?.[0] ? uploadImageToCloudinary(files.cover_image[0], "listings/cover") : Promise.resolve(void 0),
      ...(files?.images ?? []).map(
        (file) => uploadImageToCloudinary(file, "listings/gallery")
      )
    ]);
    const images = uploadedImages.filter(Boolean);
    const body = {
      ...req.body,
      location: parseIfString(req.body.location),
      price: parseIfString(req.body.price),
      referral_commission: parseIfString(req.body.referral_commission)
    };
    const listing = await listingsService.createListingInDB({
      ...body,
      ...cover_image && { cover_image },
      ...images.length > 0 && { images }
    });
    res.status(201).json({
      success: true,
      message: "Listing created successfully",
      data: listing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create listing"
    });
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
    const query = req.query;
    const result = await listingsService.getMyListingFromDB(userId, query);
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
var getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await listingsService.getListingByIdFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Listing retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyPromoters = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const result = await listingsService.getMyPromotersFromDB(userId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Promoters retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const associateId = req.user?.id;
    const files = req.files;
    let cover_image;
    let images;
    if (files?.cover_image?.[0]) {
      cover_image = await uploadImageToCloudinary(
        files.cover_image[0],
        "listings/cover"
      );
    }
    if (files?.images?.length) {
      images = await Promise.all(
        files.images.map(
          (file) => uploadImageToCloudinary(file, "listings/gallery")
        )
      );
    }
    const jsonFields = ["location", "price", "referral_commission"];
    const parsedBody = { ...req.body };
    for (const field of jsonFields) {
      if (typeof parsedBody[field] === "string") {
        try {
          parsedBody[field] = JSON.parse(parsedBody[field]);
        } catch {
          return res.status(400).json({
            success: false,
            message: `Invalid JSON format for field "${field}"`
          });
        }
      }
    }
    const updatePayload = {
      ...parsedBody,
      ...cover_image && { cover_image },
      ...images && { images }
    };
    console.log(updatePayload);
    const results = await listingsService.updateListingInDB(
      id,
      associateId,
      updatePayload
    );
    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: results
    });
  } catch (error) {
    next(error);
  }
};
var deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;
    const results = await listingsService.deleteListingFromDB(id, userId, role);
    res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
      data: results
    });
  } catch (error) {
    next(error);
  }
};
var cancelPendingListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const results = await listingsService.cancelPendingListingInDB(id, userId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Pending listing canceled successfully",
      data: results
    });
  } catch (error) {
    next(error);
  }
};
var deletePendingListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const results = await listingsService.deletePendingListingInDB(id, userId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Pending listing deleted successfully",
      data: results
    });
  } catch (error) {
    next(error);
  }
};
var manageListings2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status
    } = req.body;
    const results = await listingsService.manageListings(id, status);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: `Listing ${status} updated sucessfull`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
var listingController = {
  createListing,
  getAllListing,
  getMyListings,
  updateListing,
  getListingById,
  deleteListing,
  getMyPromoters,
  cancelPendingListing,
  deletePendingListing,
  manageListings: manageListings2
};

// src/middleware/uploadMiddleware.ts
import multer from "multer";
var storage = multer.memoryStorage();
var allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
var upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"));
    }
    cb(null, true);
  }
});
var uploadListingImages = upload.fields([
  { name: "cover_image", maxCount: 1 },
  { name: "images", maxCount: 10 }
]);

// src/modules/listings/listings.route.ts
var router3 = Router3();
router3.get("/", listingController.getAllListing);
router3.post("/", verifyToken2, uploadListingImages, listingController.createListing);
router3.get("/my", verifyToken2, listingController.getMyListings);
router3.get("/my-promoters", verifyToken2, listingController.getMyPromoters);
router3.post("/manage/:id", verifyToken2, verifyAdmin, listingController.manageListings);
router3.put("/:id", verifyToken2, uploadListingImages, listingController.updateListing);
router3.patch("/cancel/:id", verifyToken2, listingController.cancelPendingListing);
router3.patch("/delete/:id", verifyToken2, listingController.deletePendingListing);
router3.get("/:id", listingController.getListingById);
router3.delete("/:id", verifyToken2, listingController.deleteListing);
var listingsRoutes = router3;

// src/modules/listingPromote/listing.promote.route.ts
import { Router as Router4 } from "express";

// src/modules/commissionLedger/commission.ledger.service.ts
import { Types as Types4 } from "mongoose";

// src/modules/commissionLedger/commission.ledger.model.schema.ts
import { Schema as Schema6, model as model6 } from "mongoose";

// src/modules/commissionLedger/commision.ledger.interface.ts
var COMMISSION_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "disputed",
  "cancelled"
];
var COMMISSION_PAYMENT_METHODS = [
  "bank_transfer",
  "stripe",
  "helcim",
  "cash",
  "check",
  "other"
];
var PLATFORM_FEE_STATUSES = [
  "not_required",
  "pending",
  "paid",
  "failed"
];

// src/modules/commissionLedger/commission.ledger.model.schema.ts
var CommissionStatusHistorySchema = new Schema6(
  {
    status: {
      type: String,
      enum: COMMISSION_STATUSES,
      required: true
    },
    changed_by: {
      type: Schema6.Types.ObjectId,
      ref: "User",
      required: true
    },
    changed_at: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1e3
    }
  },
  { _id: false }
);
var CommissionLedgerSchema = new Schema6(
  {
    listing_id: {
      type: Schema6.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true
    },
    promotion_request_id: {
      type: Schema6.Types.ObjectId,
      ref: "PromoteRequest",
      index: true
    },
    listing_owner_id: {
      type: Schema6.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    promoter_id: {
      type: Schema6.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    created_by: {
      type: Schema6.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: COMMISSION_STATUSES,
      default: "pending",
      index: true
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      default: "USD"
    },
    listing_price_amount: {
      type: Number,
      required: true,
      min: 0
    },
    commission_rate_percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    estimated_commission_amount: {
      type: Number,
      required: true,
      min: 0
    },
    final_commission_amount: {
      type: Number,
      min: 0
    },
    deal_closed_at: {
      type: Date
    },
    payment_tracking: {
      marked_paid_by: {
        type: Schema6.Types.ObjectId,
        ref: "User"
      },
      marked_paid_at: {
        type: Date
      },
      receiver_confirmed_by: {
        type: Schema6.Types.ObjectId,
        ref: "User"
      },
      receiver_confirmed_at: {
        type: Date
      },
      payment_method: {
        type: String,
        enum: COMMISSION_PAYMENT_METHODS
      },
      payment_reference: {
        type: String,
        trim: true,
        maxlength: 255
      },
      note: {
        type: String,
        trim: true,
        maxlength: 1e3
      }
    },
    dispute: {
      opened_by: {
        type: Schema6.Types.ObjectId,
        ref: "User"
      },
      opened_at: {
        type: Date
      },
      reason: {
        type: String,
        trim: true,
        maxlength: 1e3
      },
      resolved_by: {
        type: Schema6.Types.ObjectId,
        ref: "User"
      },
      resolved_at: {
        type: Date
      },
      resolution_note: {
        type: String,
        trim: true,
        maxlength: 1e3
      }
    },
    platform_fee: {
      rate_percent: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 100
      },
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      status: {
        type: String,
        enum: PLATFORM_FEE_STATUSES,
        default: "not_required"
      },
      provider: {
        type: String,
        enum: ["stripe", "helcim"]
      },
      provider_payment_id: {
        type: String,
        trim: true
      },
      paid_at: {
        type: Date
      }
    },
    status_history: {
      type: [CommissionStatusHistorySchema],
      default: []
    },
    is_frozen: {
      type: Boolean,
      default: false
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1e3
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);
CommissionLedgerSchema.index(
  {
    promotion_request_id: 1,
    promoter_id: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      promotion_request_id: { $exists: true }
    }
  }
);
var CommissionLedger = model6(
  "CommissionLedger",
  CommissionLedgerSchema
);

// src/modules/commissionLedger/commission.ledger.utils.ts
var calculateCommissionAmount = (listingPriceAmount, commissionRatePercent) => {
  return Number(
    (listingPriceAmount * commissionRatePercent / 100).toFixed(2)
  );
};
var calculatePlatformFeeAmount = (finalCommissionAmount, platformFeeRatePercent = 4.5) => {
  return Number(
    (finalCommissionAmount * platformFeeRatePercent / 100).toFixed(2)
  );
};

// src/modules/commissionLedger/commission.ledger.service.ts
var getPaginationParams = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
var throwError3 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var toObjectId = (id) => {
  if (!Types4.ObjectId.isValid(id)) {
    throwError3("Invalid id", 400);
  }
  return new Types4.ObjectId(id);
};
var isAdminOrManager = (role) => {
  return role === "admin" || role === "manager";
};
var isSameId = (idA, idB) => {
  return String(idA) === String(idB);
};
var ensureValueExists = (value, message, statusCode) => {
  if (value == null) {
    throwError3(message, statusCode);
  }
  return value;
};
var ensureCommissionExists = (commission) => {
  return ensureValueExists(commission, "Commission record not found", 404);
};
var populateCommissionQuery = () => {
  return [
    { path: "listing_id", select: "title ref_code price referral_commission cover_image" },
    { path: "listing_owner_id", select: "fullName email role" },
    { path: "promoter_id", select: "fullName email role" },
    { path: "created_by", select: "fullName email role" }
  ];
};
var createPendingCommissionFromPromotionApproval = async ({
  listing_id,
  promotion_request_id,
  approved_by,
  promoteRequest,
  listing
}) => {
  const promoter_id = promoteRequest.requester.user_id.toString();
  const listingPriceAmount = listing.price.amount;
  const commissionRatePercent = listing.referral_commission.offered_amount;
  const estimatedCommissionAmount = calculateCommissionAmount(
    listingPriceAmount,
    commissionRatePercent
  );
  const commission = await CommissionLedger.findOneAndUpdate(
    {
      promotion_request_id: toObjectId(promotion_request_id),
      promoter_id: toObjectId(promoter_id)
    },
    {
      $setOnInsert: {
        listing_id: toObjectId(listing_id),
        promotion_request_id: toObjectId(promotion_request_id),
        listing_owner_id: listing.associate_id,
        promoter_id: toObjectId(promoter_id),
        created_by: toObjectId(approved_by),
        status: "pending",
        currency: listing.price.currency,
        listing_price_amount: listingPriceAmount,
        commission_rate_percent: commissionRatePercent,
        estimated_commission_amount: estimatedCommissionAmount,
        is_frozen: false,
        status_history: [
          {
            status: "pending",
            changed_by: toObjectId(approved_by),
            changed_at: /* @__PURE__ */ new Date(),
            note: "Commission created automatically when promotion request was approved."
          }
        ]
      }
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true
    }
  );
  return ensureCommissionExists(commission);
};
var getMyCommissionsFromDB = async (authUser, query) => {
  const filter = {
    $or: [
      { listing_owner_id: toObjectId(authUser.id) },
      { promoter_id: toObjectId(authUser.id) }
    ]
  };
  if (typeof query.status === "string") {
    filter.status = query.status;
  }
  const { page, limit, skip } = getPaginationParams(query);
  const [data, total] = await Promise.all([
    CommissionLedger.find(filter).populate(populateCommissionQuery()).sort({ created_at: -1 }).skip(skip).limit(limit),
    CommissionLedger.countDocuments(filter)
  ]);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.max(1, Math.ceil(total / limit))
    }
  };
};
var getAllCommissionsFromDB = async (query) => {
  const filter = {};
  if (typeof query.status === "string") {
    filter.status = query.status;
  }
  if (typeof query.promoter_id === "string") {
    filter.promoter_id = toObjectId(query.promoter_id);
  }
  if (typeof query.listing_owner_id === "string") {
    filter.listing_owner_id = toObjectId(query.listing_owner_id);
  }
  const { page, limit, skip } = getPaginationParams(query);
  const [data, total] = await Promise.all([
    CommissionLedger.find(filter).populate(populateCommissionQuery()).sort({ created_at: -1 }).skip(skip).limit(limit),
    CommissionLedger.countDocuments(filter)
  ]);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.max(1, Math.ceil(total / limit))
    }
  };
};
var getSingleCommissionFromDB = async (commissionId, authUser) => {
  const commission = await CommissionLedger.findById(commissionId).populate(populateCommissionQuery()).lean();
  const safeCommission = ensureCommissionExists(commission);
  const canView = isAdminOrManager(authUser.role) || isSameId(safeCommission.listing_owner_id, authUser.id) || isSameId(safeCommission.promoter_id, authUser.id);
  if (!canView) {
    throwError3("You are not allowed to view this commission record", 403);
  }
  return safeCommission;
};
var createManualCommissionIntoDB = async (authUser, payload) => {
  const listing = await Listing.findById(payload.listing_id).lean();
  const safeListing = ensureValueExists(listing, "Listing not found", 404);
  const isListingOwner = isSameId(safeListing.associate_id, authUser.id);
  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError3("Only listing owner, admin, or manager can create commission", 403);
  }
  const listingPriceAmount = safeListing.price.amount;
  const commissionRatePercent = safeListing.referral_commission.offered_amount;
  const estimatedCommissionAmount = calculateCommissionAmount(
    listingPriceAmount,
    commissionRatePercent
  );
  const finalCommissionAmount = payload.final_commission_amount ?? estimatedCommissionAmount;
  const commission = await CommissionLedger.create({
    listing_id: toObjectId(payload.listing_id),
    listing_owner_id: safeListing.associate_id,
    promoter_id: toObjectId(payload.promoter_id),
    created_by: toObjectId(authUser.id),
    status: payload.final_commission_amount !== void 0 ? "confirmed" : "pending",
    currency: safeListing.price.currency,
    listing_price_amount: listingPriceAmount,
    commission_rate_percent: commissionRatePercent,
    estimated_commission_amount: estimatedCommissionAmount,
    ...payload.final_commission_amount !== void 0 ? { final_commission_amount: payload.final_commission_amount } : {},
    platform_fee: payload.final_commission_amount !== void 0 ? {
      rate_percent: 4.5,
      amount: calculatePlatformFeeAmount(finalCommissionAmount),
      status: "pending"
    } : {
      rate_percent: 4.5,
      amount: 0,
      status: "not_required"
    },
    is_frozen: false,
    ...payload.note !== void 0 ? { note: payload.note } : {},
    status_history: [
      {
        status: payload.final_commission_amount !== void 0 ? "confirmed" : "pending",
        changed_by: toObjectId(authUser.id),
        changed_at: /* @__PURE__ */ new Date(),
        note: payload.note || "Manual commission record created."
      }
    ]
  });
  return commission;
};
var confirmCommissionIntoDB = async (commissionId, authUser, payload) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);
  if (safeCommission.is_frozen) {
    throwError3("This commission is frozen due to a dispute", 400);
  }
  const isListingOwner = isSameId(safeCommission.listing_owner_id, authUser.id);
  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError3("Only listing owner, admin, or manager can confirm commission", 403);
  }
  if (safeCommission.status !== "pending") {
    throwError3("Only pending commission can be confirmed", 400);
  }
  const platformFeeAmount = calculatePlatformFeeAmount(
    payload.final_commission_amount
  );
  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "confirmed",
        final_commission_amount: payload.final_commission_amount,
        deal_closed_at: payload.deal_closed_at ? new Date(payload.deal_closed_at) : /* @__PURE__ */ new Date(),
        platform_fee: {
          rate_percent: 4.5,
          amount: platformFeeAmount,
          status: "pending"
        }
      },
      $push: {
        status_history: {
          status: "confirmed",
          changed_by: toObjectId(authUser.id),
          changed_at: /* @__PURE__ */ new Date(),
          note: payload.note || "Commission confirmed."
        }
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
  return ensureCommissionExists(updatedCommission);
};
var markCommissionPaidIntoDB = async (commissionId, authUser, payload) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);
  if (safeCommission.is_frozen) {
    throwError3("This commission is frozen due to a dispute", 400);
  }
  const isListingOwner = isSameId(safeCommission.listing_owner_id, authUser.id);
  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError3("Only payer/listing owner, admin, or manager can mark as paid", 403);
  }
  if (safeCommission.status !== "confirmed") {
    throwError3("Only confirmed commission can be marked as paid", 400);
  }
  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "paid",
        "payment_tracking.marked_paid_by": toObjectId(authUser.id),
        "payment_tracking.marked_paid_at": /* @__PURE__ */ new Date(),
        "payment_tracking.payment_method": payload.payment_method,
        "payment_tracking.payment_reference": payload.payment_reference,
        "payment_tracking.note": payload.note
      },
      $push: {
        status_history: {
          status: "paid",
          changed_by: toObjectId(authUser.id),
          changed_at: /* @__PURE__ */ new Date(),
          note: payload.note || "Commission marked as paid."
        }
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
  return ensureCommissionExists(updatedCommission);
};
var confirmCommissionReceivedIntoDB = async (commissionId, authUser, payload) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);
  if (!isSameId(safeCommission.promoter_id, authUser.id)) {
    throwError3("Only the receiving promoter can confirm payment received", 403);
  }
  if (safeCommission.status !== "paid") {
    throwError3("Only paid commission can be confirmed as received", 400);
  }
  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        "payment_tracking.receiver_confirmed_by": toObjectId(authUser.id),
        "payment_tracking.receiver_confirmed_at": /* @__PURE__ */ new Date()
      },
      $push: {
        status_history: {
          status: "paid",
          changed_by: toObjectId(authUser.id),
          changed_at: /* @__PURE__ */ new Date(),
          note: payload.note || "Receiver confirmed payment received."
        }
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
  return ensureCommissionExists(updatedCommission);
};
var disputeCommissionIntoDB = async (commissionId, authUser, payload) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);
  const isInvolved = isSameId(safeCommission.listing_owner_id, authUser.id) || isSameId(safeCommission.promoter_id, authUser.id);
  if (!isAdminOrManager(authUser.role) && !isInvolved) {
    throwError3("You are not allowed to dispute this commission", 403);
  }
  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "disputed",
        is_frozen: true,
        "dispute.opened_by": toObjectId(authUser.id),
        "dispute.opened_at": /* @__PURE__ */ new Date(),
        "dispute.reason": payload.reason
      },
      $push: {
        status_history: {
          status: "disputed",
          changed_by: toObjectId(authUser.id),
          changed_at: /* @__PURE__ */ new Date(),
          note: payload.reason
        }
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
  return ensureCommissionExists(updatedCommission);
};
var resolveCommissionDisputeIntoDB = async (commissionId, authUser, payload) => {
  if (!isAdminOrManager(authUser.role)) {
    throwError3("Only admin or manager can resolve dispute", 403);
  }
  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: payload.final_status,
        is_frozen: false,
        "dispute.resolved_by": toObjectId(authUser.id),
        "dispute.resolved_at": /* @__PURE__ */ new Date(),
        "dispute.resolution_note": payload.resolution_note
      },
      $push: {
        status_history: {
          status: payload.final_status,
          changed_by: toObjectId(authUser.id),
          changed_at: /* @__PURE__ */ new Date(),
          note: payload.resolution_note
        }
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
  return ensureCommissionExists(updatedCommission);
};
var commissionLedgerService = {
  createPendingCommissionFromPromotionApproval,
  getMyCommissionsFromDB,
  getAllCommissionsFromDB,
  getSingleCommissionFromDB,
  createManualCommissionIntoDB,
  confirmCommissionIntoDB,
  markCommissionPaidIntoDB,
  confirmCommissionReceivedIntoDB,
  disputeCommissionIntoDB,
  resolveCommissionDisputeIntoDB
};

// src/modules/listingPromote/listing.promotion.approval.email.ts
import nodemailer4 from "nodemailer";
var TIER_DETAILS = {
  tier_1: {
    label: "Tier 1: Full Marketing + Website",
    description: "Maximum reach. Full address and visuals exposed.",
    features: [
      "Full address & geolocation revealed",
      "All photography (interior + exterior)",
      "Promoter may publish to their own website",
      "Listing appears in network newsletter"
    ]
  },
  tier_2: {
    label: "Tier 2: Full Marketing",
    description: "Distribution to qualified buyers only \u2014 no public listing.",
    features: [
      "Full address shared with vetted prospects",
      "All photography (interior + exterior)",
      "No public web publication permitted",
      "Print collateral & private decks allowed"
    ]
  },
  tier_3: {
    label: "Tier 3: Discreet Marketing",
    description: "Off-market. Whispered, never broadcast.",
    features: [
      "Address withheld until NDA signed",
      "Exterior photography only",
      "1:1 introductions only \u2014 no decks",
      "All inquiries routed through Associate"
    ]
  }
};
var TIER_COLORS = {
  tier_1: "#16a34a",
  tier_2: "#2563eb",
  tier_3: "#7c3aed"
};
var escapeHtml2 = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var getPromotionApprovalEmailHtml = (promoterName, listingTitle, listingId, tier, confirmedCommissionPct) => {
  const tierInfo = TIER_DETAILS[tier];
  const tierColor = TIER_COLORS[tier];
  const featureRows = tierInfo.features.map(
    (f) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#374151;">
          <span style="color:${tierColor};font-weight:bold;margin-right:8px;">\u2713</span>
          ${escapeHtml2(f)}
        </td>
      </tr>`
  ).join("");
  return `
    <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;">
      <div style="max-width:620px;margin:auto;background:#fff;padding:28px;border-radius:12px;">

        <h2 style="margin:0 0 16px;color:#111827;">
          Your Promotion Request Has Been Approved
        </h2>

        <p>Hello ${escapeHtml2(promoterName)},</p>

        <p>
          Congratulations! Your request to promote
          <strong>${escapeHtml2(listingTitle)}</strong> has been approved.
        </p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0;">
          <strong>Listing:</strong> ${escapeHtml2(listingTitle)}<br>
          <strong>ID:</strong> ${escapeHtml2(listingId)}
        </div>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
          <strong>Confirmed Commission:</strong>
          <span style="font-size:22px;font-weight:bold;">
            ${confirmedCommissionPct}%
          </span>
        </div>

        <div style="border-left:4px solid ${tierColor};background:#f9fafb;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0;color:${tierColor};">
            ${escapeHtml2(tierInfo.label)}
          </h3>

          <p>${escapeHtml2(tierInfo.description)}</p>

          <table style="width:100%;border-collapse:collapse;">
            ${featureRows}
          </table>
        </div>

        <p style="margin-top:20px;">
          Please ensure all promotion activities remain within the permissions
          granted by your tier.
        </p>

        <p>
          Regards,<br>
          <strong>NEWAZA Team</strong>
        </p>

      </div>
    </div>
  `;
};
var sendPromotionApprovalEmail = async ({
  toEmail,
  promoterName,
  listingTitle,
  listingId,
  tier,
  confirmedCommissionPct
}) => {
  const transporter = nodemailer4.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config_default.SMTP_AUTH_USER,
      pass: config_default.SMTP_AUTH_PASS
    }
  });
  await transporter.sendMail({
    from: config_default.SMTP_AUTH_USER,
    to: toEmail,
    subject: `You've been approved to promote: ${listingTitle}`,
    text: `Hello ${promoterName}, your request to promote "${listingTitle}" has been approved under ${tier.replace(
      "_",
      " "
    ).toUpperCase()} with a confirmed commission of ${confirmedCommissionPct}%.`,
    html: getPromotionApprovalEmailHtml(
      promoterName,
      listingTitle,
      listingId,
      tier,
      confirmedCommissionPct
    )
  });
};

// src/modules/listingPromote/listing.promote.service.ts
var createPromoteRequestInDB = async (requesterId, payload) => {
  if (!payload.listing_id || !requesterId) {
    throw new Error("listing_id and requester_id are required");
  }
  const listing = await Listing.findById(payload.listing_id);
  if (!listing) throw new Error("Listing not found");
  if (listing.associate_id.toString() === requesterId.toString()) {
    throw new Error("You cannot request to promote your own listing");
  }
  const existingRequest = await PromoteRequest.findOne({
    listing_id: payload.listing_id,
    "requester.user_id": requesterId,
    // ← was "requester._id"
    status: { $in: ["pending", "approved"] }
  });
  if (existingRequest) {
    const statusMessages = {
      pending: "You already have a pending request for this listing",
      approved: "You are already an approved promoter for this listing"
    };
    throw new Error(
      statusMessages[existingRequest.status] ?? "You have an active request for this listing"
    );
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
    PromoteRequest.find().populate("listing_id", "title ref_code cover_image"),
    // no populate on requester — email is already embedded
    queryWithDefaultSort
  ).search(["message"]).filter().sort().paginate().fieldsLimit();
  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
  return { data, meta };
};
var getMyListingsPromoteRequestFromDB = async (associateId, query) => {
  const myListingIds = await Listing.find({
    associate_id: associateId
  }).distinct("_id");
  if (myListingIds.length === 0) {
    return { data: [], meta: { page: 1, limit: 10, total: 0, totalPage: 0 } };
  }
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query
  };
  const promoteRequestQuery = new queryBuilder_default(
    PromoteRequest.find({ listing_id: { $in: myListingIds } }).populate(
      "listing_id",
      "title ref_code cover_image"
    ),
    queryWithDefaultSort
  ).search(["message"]).filter().sort().paginate().fieldsLimit();
  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
  return { data, meta };
};
var getMyPromoteRequestsFromDB = async (requesterId, query) => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query
  };
  const promoteRequestQuery = new queryBuilder_default(
    PromoteRequest.find({
      "requester.user_id": requesterId,
      is_deleted: { $ne: true }
    }).populate("listing_id", "title ref_code cover_image price"),
    queryWithDefaultSort
  ).search(["message"]).filter().sort().paginate().fieldsLimit();
  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
  return { data, meta };
};
var deletePromoteRequest = async (id, role) => {
  if (role !== "admin") {
    throw new UnauthorizedError("Only admins can perform this action");
  }
  const promoteRequest = await PromoteRequest.findById(id);
  if (!promoteRequest) {
    throw new NotFoundError("Promote request not found");
  }
  promoteRequest.is_deleted = true;
  promoteRequest.deleted_at = /* @__PURE__ */ new Date();
  return await promoteRequest.save();
};
var manageListingPromoteRequestInDB = async (promoteRequestId, userId, isAdmin, approved_by, payload) => {
  const promoteRequest = await PromoteRequest.findById(promoteRequestId);
  if (!promoteRequest) throw new Error("Promote request not found");
  const listing = await Listing.findById(promoteRequest.listing_id);
  if (!listing) throw new Error("Related listing not found");
  const isOwner = listing.associate_id.toString() === userId.toString();
  if (!isOwner && !isAdmin) {
    throw new UnauthorizedError(
      "You are not authorized to manage this promote request"
    );
  }
  if (promoteRequest.status !== "pending") {
    throw new Error("This request has already been resolved");
  }
  promoteRequest.status = payload.status;
  if (payload.status === "approved") {
    if (!payload.selected_tier) {
      throw new Error(
        "selected_tier is required when approving a promote request"
      );
    }
    promoteRequest.selected_tier = payload.selected_tier;
    promoteRequest.confirmed_commission_pct = payload.confirmed_commission_pct ?? promoteRequest.proposed_commission_pct;
    await Promise.all([
      createPendingCommissionFromPromotionApproval({
        approved_by: userId,
        listing_id: promoteRequest.listing_id.toString(),
        promotion_request_id: promoteRequest._id.toString(),
        promoteRequest,
        listing
      }),
      promoteRequest.save()
    ]);
    sendPromotionApprovalEmail({
      toEmail: promoteRequest.requester.email,
      promoterName: promoteRequest.requester.email.split("@")[0] || "Promoter",
      listingTitle: listing.title,
      listingId: listing._id.toString(),
      tier: promoteRequest.selected_tier,
      confirmedCommissionPct: promoteRequest.confirmed_commission_pct
    }).catch(
      (err) => console.error("Promotion approval email failed silently:", err)
    );
    return promoteRequest;
  }
  await promoteRequest.save();
  return promoteRequest;
};
var cancelPromoteRequestInDB = async (requestId, requesterId) => {
  const promoteRequest = await PromoteRequest.findById(requestId);
  if (!promoteRequest) {
    throw new Error("Promote request not found");
  }
  if (promoteRequest.requester.user_id.toString() !== requesterId.toString()) {
    throw new Error("You are not authorized to cancel this request");
  }
  if (promoteRequest.status !== "pending") {
    throw new Error("Only pending requests can be cancelled");
  }
  promoteRequest.status = "cancelled";
  return await promoteRequest.save();
};
var listingPromoteRequestService = {
  createPromoteRequestInDB,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequestFromDB,
  manageListingPromoteRequestInDB,
  getMyPromoteRequestsFromDB,
  cancelPromoteRequestInDB,
  deletePromoteRequest
};

// src/modules/listingPromote/listing.promote.controller.ts
var createListingPromoteRequest = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;
    const requesterEmail = req.user?.email;
    const payload = req.body;
    const updatedPayload = {
      ...payload,
      requester: {
        user_id: requesterId,
        email: requesterEmail
      }
    };
    const result = await listingPromoteRequestService.createPromoteRequestInDB(requesterId, updatedPayload);
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
var getMyPromoteRequests = async (req, res, next) => {
  try {
    const requesterId = req.user?.id;
    const query = req.query;
    const result = await listingPromoteRequestService.getMyPromoteRequestsFromDB(requesterId, query);
    console.log(result);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Your promote requests retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var cencelPromoteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const result = await listingPromoteRequestService.cancelPromoteRequestInDB(id, requesterId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Promote request cancelled successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var manageListingPromoteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;
    const isAdmin = req.user?.role === "admin";
    if (!payload.status || !["approved", "rejected"].includes(payload.status)) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "status must be either 'approved' or 'rejected'",
        data: null
      });
    }
    const result = await listingPromoteRequestService.manageListingPromoteRequestInDB(
      id,
      // promoteRequestId
      userId,
      // the user managing the request
      isAdmin,
      role,
      payload
    );
    res.status(200).json({
      success: true,
      message: `Promote request ${payload.status} successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deletePromoteRequest2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const result = await listingPromoteRequestService.deletePromoteRequest(id, role);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Deleted Promote Request successfully",
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
  manageListingPromoteRequest,
  getMyPromoteRequests,
  cencelPromoteRequest,
  deletePromoteRequest: deletePromoteRequest2
};

// src/modules/listingPromote/listing.promote.route.ts
var router4 = Router4();
router4.get("/all", listingPromoteRequestController.getAllListingPromoteRequest);
router4.post("/", verifyToken2, listingPromoteRequestController.createListingPromoteRequest);
router4.post("/manage/:id", verifyToken2, listingPromoteRequestController.manageListingPromoteRequest);
router4.get("/received", verifyToken2, listingPromoteRequestController.getMyListingsPromoteRequest);
router4.get("/sent", verifyToken2, listingPromoteRequestController.getMyPromoteRequests);
router4.delete("/:id", verifyToken2, listingPromoteRequestController.deletePromoteRequest);
router4.put("/:id", verifyToken2, listingPromoteRequestController.cencelPromoteRequest);
var listingPromoteRequestRoutes = router4;

// src/modules/commissionLedger/commission.ledger.route.ts
import { Router as Router5 } from "express";

// src/modules/commissionLedger/commission.ledger.validation.ts
import { z as z3 } from "zod";
import { Types as Types5 } from "mongoose";
var mongoIdValidation = z3.string().refine((id) => Types5.ObjectId.isValid(id), {
  message: "Invalid id"
});
var commissionIdValidation = z3.object({
  params: z3.object({
    id: mongoIdValidation
  })
});
var createManualCommissionValidation = z3.object({
  body: z3.object({
    listing_id: mongoIdValidation,
    promoter_id: mongoIdValidation,
    final_commission_amount: z3.number().min(0).optional(),
    note: z3.string().trim().max(1e3).optional()
  })
});
var confirmCommissionValidation = z3.object({
  params: z3.object({
    id: mongoIdValidation
  }),
  body: z3.object({
    final_commission_amount: z3.number().min(0),
    deal_closed_at: z3.string().datetime().optional(),
    note: z3.string().trim().max(1e3).optional()
  })
});
var markCommissionPaidValidation = z3.object({
  params: z3.object({
    id: mongoIdValidation
  }),
  body: z3.object({
    payment_method: z3.enum(COMMISSION_PAYMENT_METHODS),
    payment_reference: z3.string().trim().max(255).optional(),
    note: z3.string().trim().max(1e3).optional()
  })
});
var confirmCommissionReceivedValidation = z3.object({
  params: z3.object({
    id: mongoIdValidation
  }),
  body: z3.object({
    note: z3.string().trim().max(1e3).optional()
  })
});
var disputeCommissionValidation = z3.object({
  params: z3.object({
    id: mongoIdValidation
  }),
  body: z3.object({
    reason: z3.string().trim().min(5).max(1e3)
  })
});
var resolveDisputeValidation = z3.object({
  params: z3.object({
    id: mongoIdValidation
  }),
  body: z3.object({
    final_status: z3.enum(COMMISSION_STATUSES).refine(
      (status) => status !== "disputed",
      {
        message: "Final status cannot be disputed"
      }
    ),
    resolution_note: z3.string().trim().min(5).max(1e3)
  })
});

// src/modules/commissionLedger/commission.ledger.controller.ts
var getAuthUser = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  if (typeof req.user.id !== "string") {
    throw new UnauthorizedError("Invalid authenticated user");
  }
  return {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  };
};
var getMyCommissions = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const result = await commissionLedgerService.getMyCommissionsFromDB(
      authUser,
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "My commission records retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllCommissions = async (req, res, next) => {
  try {
    const result = await commissionLedgerService.getAllCommissionsFromDB(
      req.query
    );
    console.log("result2:", result);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission records retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleCommission = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = commissionIdValidation.parse({
      params: req.params
    });
    const result = await commissionLedgerService.getSingleCommissionFromDB(
      validatedData.params.id,
      authUser
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission record retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var createManualCommission = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = createManualCommissionValidation.parse({
      body: req.body
    });
    const result = await commissionLedgerService.createManualCommissionIntoDB(
      authUser,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Manual commission record created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var confirmCommission = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = confirmCommissionValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await commissionLedgerService.confirmCommissionIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission confirmed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var markCommissionPaid = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = markCommissionPaidValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await commissionLedgerService.markCommissionPaidIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission marked as paid successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var confirmCommissionReceived = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = confirmCommissionReceivedValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await commissionLedgerService.confirmCommissionReceivedIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission payment received confirmation saved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var disputeCommission = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = disputeCommissionValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await commissionLedgerService.disputeCommissionIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission disputed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var resolveCommissionDispute = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = resolveDisputeValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await commissionLedgerService.resolveCommissionDisputeIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission dispute resolved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var commissionLedgerController = {
  getMyCommissions,
  getAllCommissions,
  getSingleCommission,
  createManualCommission,
  confirmCommission,
  markCommissionPaid,
  confirmCommissionReceived,
  disputeCommission,
  resolveCommissionDispute
};

// src/modules/commissionLedger/commission.ledger.route.ts
var router5 = Router5();
router5.use(verifyToken2);
router5.get(
  "/admin/all",
  authorizeRoles("admin", "manager"),
  commissionLedgerController.getAllCommissions
);
router5.patch(
  "/admin/:id/resolve-dispute",
  authorizeRoles("admin", "manager"),
  commissionLedgerController.resolveCommissionDispute
);
router5.get("/my", commissionLedgerController.getMyCommissions);
router5.post(
  "/manual",
  authorizeRoles("associate", "partner", "admin", "manager"),
  commissionLedgerController.createManualCommission
);
router5.get("/:id", commissionLedgerController.getSingleCommission);
router5.patch("/:id/confirm", commissionLedgerController.confirmCommission);
router5.patch("/:id/mark-paid", commissionLedgerController.markCommissionPaid);
router5.patch(
  "/:id/confirm-received",
  commissionLedgerController.confirmCommissionReceived
);
router5.patch("/:id/dispute", commissionLedgerController.disputeCommission);
var commissionLedgerRoutes = router5;

// src/modules/admin/admin.route.ts
import { Router as Router6 } from "express";

// src/modules/admin/admin.service.ts
import { Types as Types6 } from "mongoose";

// src/utility/sendAccountApprovedMail.ts
var getAccessLabel = (accessTo) => {
  if (accessTo === "we_command_center") {
    return "W\xC9 Command Center";
  }
  if (accessTo === "invictus") {
    return "INVICTUS Academy";
  }
  if (accessTo === "both") {
    return "W\xC9 Command Center + INVICTUS Academy";
  }
  return "your approved dashboard";
};
var sendAccountApprovedMail = async ({
  fullName,
  email,
  role,
  accessTo
}) => {
  const accessLabel = getAccessLabel(accessTo);
  await sendCustomMail_default({
    to: email,
    subject: "Your World Elite Account Has Been Approved",
    text: `Hello ${fullName}, your World Elite account has been approved. You can now log in and access ${accessLabel}.`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:30px; border-radius:12px;">
          <h2 style="margin:0 0 15px; color:#111827;">
            Your Account Has Been Approved
          </h2>

          <p style="font-size:15px; color:#374151;">
            Hello ${fullName},
          </p>

          <p style="font-size:15px; color:#374151;">
            Your World Elite account has been approved successfully.
          </p>

          <div style="margin:22px 0; padding:18px; background:#f3f4f6; border-radius:10px;">
            <p style="margin:0 0 8px; color:#111827;">
              <strong>Role:</strong> ${role}
            </p>
            <p style="margin:0; color:#111827;">
              <strong>Access:</strong> ${accessLabel}
            </p>
          </div>

          <p style="font-size:15px; color:#374151;">
            You can now log in to your account and access your approved dashboard.
          </p>

          <p style="font-size:14px; color:#6b7280; margin-top:25px;">
            Thank you,<br />
            World Elite Team
          </p>
        </div>
      </div>
    `
  });
};

// src/modules/users/user.approvalMail.ts
var sendApprovalEmailIfFullyApproved = async (userId) => {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      approvalStatus: "approved",
      accountStatus: "active",
      licenseVerificationStatus: "verified",
      $or: [
        { approvalEmailSentAt: { $exists: false } },
        { approvalEmailSentAt: null }
      ]
    },
    {
      $set: {
        approvalEmailSentAt: /* @__PURE__ */ new Date()
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select(
    "fullName email role accessTo approvalStatus accountStatus licenseVerificationStatus approvalEmailSentAt"
  );
  if (!user) {
    return null;
  }
  try {
    await sendAccountApprovedMail({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessTo: user.accessTo
    });
    return user;
  } catch (error) {
    await User.findByIdAndUpdate(user._id, {
      $unset: {
        approvalEmailSentAt: ""
      }
    });
    console.error(
      "Account approval email failed:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
};

// src/modules/admin/admin.service.ts
var throwError4 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var updateUserApprovalStatusIntoDB = async (userId, payload, adminId) => {
  if (!Types6.ObjectId.isValid(userId)) {
    throwError4("Invalid user id", 400);
  }
  const updateQuery = {
    $set: {
      approvalStatus: payload.approvalStatus
    }
  };
  if (payload.approvalStatus === "approved") {
    updateQuery.$set.approvedBy = new Types6.ObjectId(adminId);
    updateQuery.$set.approvedAt = /* @__PURE__ */ new Date();
    updateQuery.$unset = {
      rejectedReason: ""
    };
  }
  if (payload.approvalStatus === "rejected") {
    const rejectedReason = payload.rejectedReason?.trim();
    if (!rejectedReason) {
      throwError4("Rejected reason is required", 400);
    }
    updateQuery.$set.rejectedReason = rejectedReason;
    updateQuery.$unset = {
      approvedBy: "",
      approvedAt: ""
    };
  }
  if (payload.approvalStatus === "pending") {
    updateQuery.$unset = {
      approvedBy: "",
      approvedAt: "",
      rejectedReason: ""
    };
  }
  const updatedUser = await User.findByIdAndUpdate(userId, updateQuery, {
    new: true,
    runValidators: true
  }).select("-password");
  if (!updatedUser) {
    throwError4("User not found", 404);
  }
  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));
  return updatedUser;
};
var updateUserLicenseVerificationStatusIntoDB = async (userId, payload) => {
  if (!Types6.ObjectId.isValid(userId)) {
    throwError4("Invalid user id", 400);
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        licenseVerificationStatus: payload.licenseVerificationStatus
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password");
  if (!updatedUser) {
    throwError4("User not found", 404);
  }
  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));
  return updatedUser;
};
var updateUserAccountStatusIntoDB = async (userId, payload) => {
  if (!Types6.ObjectId.isValid(userId)) {
    throwError4("Invalid user id", 400);
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        accountStatus: payload.accountStatus
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password");
  if (!updatedUser) {
    throwError4("User not found", 404);
  }
  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));
  return updatedUser;
};
var adminService = {
  updateUserApprovalStatusIntoDB,
  updateUserLicenseVerificationStatusIntoDB,
  updateUserAccountStatusIntoDB
};

// src/modules/admin/admin.validation.ts
import { z as z4 } from "zod";
import { Types as Types7 } from "mongoose";
var mongoIdValidation2 = z4.string().refine((id) => Types7.ObjectId.isValid(id), {
  message: "Invalid user id"
});
var updateApprovalStatusValidation = z4.object({
  params: z4.object({
    id: mongoIdValidation2
  }),
  body: z4.object({
    approvalStatus: z4.enum(APPROVAL_STATUSES),
    rejectedReason: z4.string().trim().max(500).optional()
  })
}).superRefine((data, ctx) => {
  if (data.body.approvalStatus === "rejected" && !data.body.rejectedReason) {
    ctx.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["body", "rejectedReason"],
      message: "Rejected reason is required when approval status is rejected"
    });
  }
});
var updateLicenseVerificationStatusValidation = z4.object({
  params: z4.object({
    id: mongoIdValidation2
  }),
  body: z4.object({
    licenseVerificationStatus: z4.enum(LICENSE_VERIFICATION_STATUSES)
  })
});
var updateAccountStatusValidation = z4.object({
  params: z4.object({
    id: mongoIdValidation2
  }),
  body: z4.object({
    accountStatus: z4.enum(ACCOUNT_STATUSES)
  })
});

// src/modules/admin/admin.controller.ts
var updateUserApprovalStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }
    const adminId = req.user.id;
    if (typeof adminId !== "string") {
      return next(new UnauthorizedError("Invalid authenticated user"));
    }
    const validatedData = updateApprovalStatusValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await adminService.updateUserApprovalStatusIntoDB(
      validatedData.params.id,
      validatedData.body,
      adminId
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User approval status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateUserLicenseVerificationStatus = async (req, res, next) => {
  try {
    const validatedData = updateLicenseVerificationStatusValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await adminService.updateUserLicenseVerificationStatusIntoDB(
      validatedData.params.id,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User license verification status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateUserAccountStatus = async (req, res, next) => {
  try {
    const validatedData = updateAccountStatusValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await adminService.updateUserAccountStatusIntoDB(
      validatedData.params.id,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User account status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var adminController = {
  updateUserApprovalStatus,
  updateUserLicenseVerificationStatus,
  updateUserAccountStatus
};

// src/modules/admin/admin.route.ts
var router6 = Router6();
router6.patch(
  "/users/:id/approval-status",
  verifyToken2,
  authorizeRoles("admin", "manager"),
  adminController.updateUserApprovalStatus
);
router6.patch(
  "/users/:id/license-verification-status",
  verifyToken2,
  authorizeRoles("admin", "manager"),
  adminController.updateUserLicenseVerificationStatus
);
router6.patch(
  "/users/:id/account-status",
  verifyToken2,
  authorizeRoles("admin", "manager"),
  adminController.updateUserAccountStatus
);
var adminRoutes = router6;

// src/modules/listingAssets/listing.assets.route.ts
import { Router as Router7 } from "express";

// src/modules/listingAssets/listing.assets.service.ts
import { ZipArchive } from "archiver";
import { Types as Types8 } from "mongoose";

// src/modules/listingAssets/listing.assets.model.schema.ts
import { Schema as Schema7, model as model7 } from "mongoose";
var ListingAssetDownloadSchema = new Schema7(
  {
    listing_id: {
      type: Schema7.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true
    },
    downloaded_by: {
      type: Schema7.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    promotion_request_id: {
      type: Schema7.Types.ObjectId,
      ref: "PromoteRequest"
    },
    user_role: {
      type: String,
      enum: USER_ROLES,
      required: true
    },
    assets_snapshot: {
      package_type: {
        type: String,
        enum: ["zip"],
        default: "zip"
      },
      image_count: {
        type: Number,
        default: 0,
        min: 0
      },
      file_names: {
        type: [String],
        default: []
      },
      captions: {
        type: [String],
        default: []
      },
      one_pager_file_name: {
        type: String,
        default: "one-pager.pdf"
      }
    },
    ip_address: {
      type: String,
      trim: true
    },
    user_agent: {
      type: String,
      trim: true
    },
    downloaded_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);
ListingAssetDownloadSchema.index({
  listing_id: 1,
  downloaded_by: 1,
  downloaded_at: -1
});
var ListingAssetDownload = model7(
  "ListingAssetDownload",
  ListingAssetDownloadSchema
);

// src/modules/listingAssets/listing.assets.utils.ts
import { Buffer } from "buffer";
import axios from "axios";
import PDFDocument from "pdfkit";
var sanitizeFileName = (value) => {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return sanitized || "listing-assets";
};
var isHttpUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};
var getImageExtension = (mimeType, fallbackUrl) => {
  const normalizedMimeType = mimeType.toLowerCase();
  if (normalizedMimeType.includes("jpeg") || normalizedMimeType.includes("jpg")) {
    return "jpg";
  }
  if (normalizedMimeType.includes("png")) {
    return "png";
  }
  if (normalizedMimeType.includes("webp")) {
    return "webp";
  }
  try {
    const pathname = new URL(fallbackUrl).pathname;
    const extension = pathname.split(".").pop()?.toLowerCase();
    if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
      return extension === "jpeg" ? "jpg" : extension;
    }
  } catch {
    return "jpg";
  }
  return "jpg";
};
var downloadImageFromUrl = async (imageUrl, fileNamePrefix) => {
  if (!imageUrl || !isHttpUrl(imageUrl)) {
    return null;
  }
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15e3,
      maxContentLength: 20 * 1024 * 1024,
      validateStatus: (status) => status >= 200 && status < 300
    });
    const contentType = String(response.headers["content-type"] || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      return null;
    }
    const extension = getImageExtension(contentType, imageUrl);
    return {
      fileName: `${fileNamePrefix}.${extension}`,
      buffer: Buffer.from(response.data),
      mimeType: contentType
    };
  } catch {
    return null;
  }
};
var generateListingCaptions = (listing) => {
  const locationText = `${listing.location.city}, ${listing.location.region}, ${listing.location.country}`;
  return [
    `${listing.title} is now available in ${locationText}. Reference: ${listing.ref_code}.`,
    `Explore this World Elite property opportunity in ${locationText}.`,
    `For private details about ${listing.title}, please contact the listing representative. Reference: ${listing.ref_code}.`
  ];
};
var generateCaptionsTextFile = (captions) => {
  return captions.map((caption, index) => `${index + 1}. ${caption}`).join("\n\n");
};
var formatPrice = (amount, currency) => {
  return `${currency} ${amount.toLocaleString()}`;
};
var canEmbedInPdf = (image) => {
  return image.mimeType.includes("jpeg") || image.mimeType.includes("jpg") || image.mimeType.includes("png");
};
var generateListingOnePagerPdf = async (listing, images, captions) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      autoFirstPage: true
    });
    const chunks = [];
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);
    doc.fontSize(22).fillColor("#111111").text("WORLD ELITE", {
      align: "center"
    });
    doc.moveDown(0.4);
    doc.fontSize(16).fillColor("#333333").text("Property One-Pager", {
      align: "center"
    });
    doc.moveDown(1);
    const coverImage = images.find(canEmbedInPdf);
    if (coverImage) {
      try {
        doc.image(coverImage.buffer, {
          fit: [500, 260],
          align: "center"
        });
        doc.moveDown(1);
      } catch {
        doc.fontSize(10).fillColor("#555555").text("Cover image could not be embedded in the PDF.");
        doc.moveDown(1);
      }
    }
    doc.fontSize(18).fillColor("#111111").text(listing.title);
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#222222").text(`Reference Code: ${listing.ref_code}`).text(
      `Location: ${listing.location.city}, ${listing.location.region}, ${listing.location.country}`
    ).text(`Price: ${formatPrice(listing.price.amount, listing.price.currency)}`).text(`Bedrooms: ${listing.bedrooms}`).text(`Bathrooms: ${listing.bathrooms}`).text(`Area: ${listing.area_sqm} sqm`).text(`Referral Commission Offered: ${listing.referral_commission.offered_amount}%`);
    doc.moveDown(1);
    doc.fontSize(14).fillColor("#111111").text("Suggested Captions");
    doc.moveDown(0.5);
    captions.forEach((caption, index) => {
      doc.fontSize(10).fillColor("#333333").text(`${index + 1}. ${caption}`);
      doc.moveDown(0.4);
    });
    doc.moveDown(1);
    doc.fontSize(9).fillColor("#555555").text(
      "This asset package is provided for approved World Elite listing promotion use only.",
      {
        align: "center"
      }
    );
    doc.end();
  });
};

// src/modules/listingAssets/listing.assets.service.ts
var throwError5 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var toObjectId2 = (id) => {
  if (!Types8.ObjectId.isValid(id)) {
    throwError5("Invalid id", 400);
  }
  return new Types8.ObjectId(id);
};
var isAdminOrManager2 = (role) => {
  return role === "admin" || role === "manager";
};
var isAllowedPromoterRole = (role) => {
  return role === "associate" || role === "partner" || role === "ambassador";
};
var ensureListingExists = (listing) => {
  if (listing == null) {
    throwError5("Listing not found", 404);
  }
  return listing;
};
var filterValidImageUrls = (imageUrls) => {
  return imageUrls.filter((imageUrl) => {
    return typeof imageUrl === "string" && imageUrl.trim().length > 0;
  });
};
var downloadListingAssetsZipFromDB = async (listingId, authUser, meta) => {
  const listing = await Listing.findById(listingId).lean();
  const safeListing = ensureListingExists(listing);
  const isListingOwner = String(safeListing.associate_id) === authUser.id;
  let promotionRequestId;
  const hasDirectAccess = isAdminOrManager2(authUser.role) || isListingOwner;
  if (!hasDirectAccess) {
    if (!isAllowedPromoterRole(authUser.role)) {
      throwError5("You are not allowed to download listing assets", 403);
    }
    const approvedRequest = await PromoteRequest.findOne({
      listing_id: toObjectId2(listingId),
      requester_id: toObjectId2(authUser.id),
      status: "approved"
    }).lean();
    if (!approvedRequest) {
      throwError5(
        "You must be approved to promote this listing before downloading assets",
        403
      );
    }
    promotionRequestId = approvedRequest?._id;
  }
  const rawImageUrls = filterValidImageUrls([
    safeListing.cover_image,
    ...safeListing.images || []
  ]);
  const uniqueImageUrls = [...new Set(rawImageUrls)];
  const downloadedImages = await Promise.all(
    uniqueImageUrls.map((imageUrl, index) => {
      const fileNamePrefix = index === 0 ? "cover-image" : `property-image-${index}`;
      return downloadImageFromUrl(imageUrl, fileNamePrefix);
    })
  );
  const validImages = downloadedImages.filter(
    (image) => Boolean(image)
  );
  const captions = generateListingCaptions(safeListing);
  const onePagerPdfBuffer = await generateListingOnePagerPdf(
    safeListing,
    validImages,
    captions
  );
  const captionsText = generateCaptionsTextFile(captions);
  const archive = new ZipArchive({
    zlib: {
      level: 9
    }
  });
  const fileNames = [];
  validImages.forEach((image) => {
    const imageFilePath = `images/${image.fileName}`;
    archive.append(image.buffer, {
      name: imageFilePath
    });
    fileNames.push(imageFilePath);
  });
  archive.append(onePagerPdfBuffer, {
    name: "one-pager.pdf"
  });
  fileNames.push("one-pager.pdf");
  archive.append(captionsText, {
    name: "captions.txt"
  });
  fileNames.push("captions.txt");
  const logPayload = {
    listing_id: toObjectId2(listingId),
    downloaded_by: toObjectId2(authUser.id),
    user_role: authUser.role,
    assets_snapshot: {
      package_type: "zip",
      image_count: validImages.length,
      file_names: fileNames,
      captions,
      one_pager_file_name: "one-pager.pdf"
    },
    downloaded_at: /* @__PURE__ */ new Date()
  };
  if (promotionRequestId) {
    logPayload.promotion_request_id = promotionRequestId;
  }
  if (meta.ip_address) {
    logPayload.ip_address = meta.ip_address;
  }
  if (meta.user_agent) {
    logPayload.user_agent = meta.user_agent;
  }
  await ListingAssetDownload.create(logPayload);
  const zipFileName = `${sanitizeFileName(
    safeListing.ref_code || safeListing.title
  )}-assets.zip`;
  return {
    archive,
    fileName: zipFileName
  };
};
var getListingAssetLogsFromDB = async (listingId, authUser) => {
  const listing = await Listing.findById(listingId).lean();
  const safeListing = ensureListingExists(listing);
  const isListingOwner = String(safeListing.associate_id) === authUser.id;
  if (!isAdminOrManager2(authUser.role) && !isListingOwner) {
    throwError5("You are not allowed to view asset download logs", 403);
  }
  return ListingAssetDownload.find({
    listing_id: toObjectId2(listingId)
  }).populate("downloaded_by", "fullName email role").populate("listing_id", "title ref_code").sort({ downloaded_at: -1 });
};
var getAllListingAssetLogsFromDB = async (authUser) => {
  if (!isAdminOrManager2(authUser.role)) {
    throwError5("Only admin or manager can view all asset download logs", 403);
  }
  return ListingAssetDownload.find().populate("downloaded_by", "fullName email role").populate("listing_id", "title ref_code").sort({ downloaded_at: -1 });
};
var listingAssetsService = {
  downloadListingAssetsZipFromDB,
  getListingAssetLogsFromDB,
  getAllListingAssetLogsFromDB
};

// src/modules/listingAssets/listing.assets.validation.ts
import { z as z5 } from "zod";
import { Types as Types9 } from "mongoose";
var mongoIdValidation3 = z5.string().refine((id) => Types9.ObjectId.isValid(id), {
  message: "Invalid listing id"
});
var downloadListingAssetsValidation = z5.object({
  params: z5.object({
    listingId: mongoIdValidation3
  })
});
var listingAssetLogsValidation = z5.object({
  params: z5.object({
    listingId: mongoIdValidation3
  })
});

// src/modules/listingAssets/listing.assets.controller.ts
var getAuthUser2 = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  if (typeof req.user.id !== "string") {
    throw new UnauthorizedError("Invalid authenticated user");
  }
  return {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  };
};
var downloadListingAssets = async (req, res, next) => {
  try {
    const authUser = getAuthUser2(req);
    const validatedData = downloadListingAssetsValidation.parse({
      params: req.params
    });
    const result = await listingAssetsService.downloadListingAssetsZipFromDB(
      validatedData.params.listingId,
      authUser,
      {
        ip_address: req.ip,
        user_agent: req.get("user-agent")
      }
    );
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`
    );
    result.archive.on("error", (error) => {
      next(error);
    });
    result.archive.pipe(res);
    await result.archive.finalize();
  } catch (error) {
    next(error);
  }
};
var getListingAssetLogs = async (req, res, next) => {
  try {
    const authUser = getAuthUser2(req);
    const validatedData = listingAssetLogsValidation.parse({
      params: req.params
    });
    const result = await listingAssetsService.getListingAssetLogsFromDB(
      validatedData.params.listingId,
      authUser
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Listing asset download logs retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllListingAssetLogs = async (req, res, next) => {
  try {
    const authUser = getAuthUser2(req);
    const result = await listingAssetsService.getAllListingAssetLogsFromDB(authUser);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All listing asset download logs retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var listingAssetsController = {
  downloadListingAssets,
  getListingAssetLogs,
  getAllListingAssetLogs
};

// src/modules/listingAssets/listing.assets.route.ts
var router7 = Router7();
router7.use(verifyToken2);
router7.get(
  "/admin/download-logs",
  authorizeRoles("admin", "manager"),
  listingAssetsController.getAllListingAssetLogs
);
router7.post(
  "/:listingId/download",
  listingAssetsController.downloadListingAssets
);
router7.get(
  "/:listingId/download-logs",
  listingAssetsController.getListingAssetLogs
);
var listingAssetsRoutes = router7;

// src/modules/payment/payment.route.ts
import { Router as Router8 } from "express";

// src/modules/payment/payment.validation.ts
import { z as z6 } from "zod";
var createUpgradeCheckoutValidation = z6.object({
  body: z6.object({
    discountCode: z6.string().trim().max(50).optional()
  }).optional()
});
var paymentRolePricingValidation = z6.object({
  params: z6.object({
    role: z6.enum([
      "associate",
      "partner",
      "ambassador",
      "ceo",
      "ceo_partner",
      "we_club_member"
    ]),
    accessTo: z6.enum(["we_command_center", "invictus", "both"])
  })
});
var verifyCheckoutSessionValidation = z6.object({
  params: z6.object({
    sessionId: z6.string().min(5)
  })
});

// src/modules/payment/payment.controller.ts
var getAuthUserId = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  return req.user.id;
};
var getAllPricingPlans2 = async (_req, res, next) => {
  try {
    const result = paymentService.getAllPricingPlans();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Pricing plans retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getPricingPlanByRoleAndAccess2 = async (req, res, next) => {
  try {
    const validatedData = paymentRolePricingValidation.parse({
      params: req.params
    });
    const result = paymentService.getPricingPlanByRoleAndAccess(
      validatedData.params.role,
      validatedData.params.accessTo
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Pricing plan retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var createUpgradeCheckout = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    const validatedData = createUpgradeCheckoutValidation.parse({
      body: req.body
    });
    const result = await paymentService.createUpgradeCheckoutSessionIntoStripe(
      userId,
      validatedData.body?.discountCode
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Stripe checkout session created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var verifyCheckoutSession = async (req, res, next) => {
  try {
    const validatedData = verifyCheckoutSessionValidation.parse({
      params: req.params
    });
    const result = await paymentService.verifyCheckoutSessionFromStripe(
      validatedData.params.sessionId
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var stripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];
    await paymentService.handleStripeWebhook(req.body, signature);
    res.status(200).json({
      received: true
    });
  } catch (error) {
    next(error);
  }
};
var paymentController = {
  getAllPricingPlans: getAllPricingPlans2,
  getPricingPlanByRoleAndAccess: getPricingPlanByRoleAndAccess2,
  createUpgradeCheckout,
  verifyCheckoutSession,
  stripeWebhook
};

// src/modules/payment/payment.route.ts
var router8 = Router8();
router8.get("/pricing", paymentController.getAllPricingPlans);
router8.get("/pricing/:role/:accessTo", paymentController.getPricingPlanByRoleAndAccess);
router8.post(
  "/upgrade",
  verifyToken2,
  paymentController.createUpgradeCheckout
);
router8.get(
  "/verify-session/:sessionId",
  paymentController.verifyCheckoutSession
);
var paymentRoutes = router8;

// src/modules/profile/profile.route.ts
import { Router as Router9 } from "express";

// src/modules/profile/profile.service.ts
var throwError6 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var ensureUserExists = (user) => {
  if (user == null) {
    throwError6("User not found", 404);
  }
  return user;
};
var getDefaultProfileImage = () => {
  return config_default.DEFAULT_PROFILE_IMAGE_URL;
};
var formatProfileResponse = (user) => {
  return {
    ...user,
    profileImage: user.profileImage || getDefaultProfileImage()
  };
};
var getMyProfileFromDB = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) {
    throwError6("User not found", 404);
  }
  const safeUser = ensureUserExists(user);
  return formatProfileResponse(safeUser);
};
var updateBasicProfileIntoDB = async (userId, payload) => {
  const updateData = {};
  const allowedFields = [
    "fullName",
    "brokerage",
    "phone",
    "city",
    "country"
  ];
  allowedFields.forEach((field) => {
    const value = payload[field];
    if (value !== void 0) {
      updateData[field] = value;
    }
  });
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: updateData
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password").lean();
  const safeUpdatedUser = ensureUserExists(updatedUser);
  return formatProfileResponse(safeUpdatedUser);
};
var updateBioIntoDB = async (userId, payload) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        bio: payload.bio
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password").lean();
  const safeUpdatedUser = ensureUserExists(updatedUser);
  return formatProfileResponse(safeUpdatedUser);
};
var upsertSocialLinkIntoDB = async (userId, payload) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        [`socialLinks.${payload.platform}`]: payload.url
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password").lean();
  const safeUpdatedUser = ensureUserExists(updatedUser);
  return formatProfileResponse(safeUpdatedUser);
};
var deleteSocialLinkFromDB = async (userId, platform) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        [`socialLinks.${platform}`]: ""
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password").lean();
  const safeUpdatedUser = ensureUserExists(updatedUser);
  return formatProfileResponse(safeUpdatedUser);
};
var updateMarketingChannelsIntoDB = async (userId, payload) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        marketingChannels: payload.marketingChannels
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password").lean();
  const safeUpdatedUser = ensureUserExists(updatedUser);
  return formatProfileResponse(safeUpdatedUser);
};
var updateProfileImageIntoDB = async (userId, file) => {
  const profileImageUrl = await uploadImageToCloudinary(
    file,
    "newaza/profile-images"
  );
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        profileImage: profileImageUrl
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password").lean();
  const safeUpdatedUser = ensureUserExists(updatedUser);
  return formatProfileResponse(safeUpdatedUser);
};
var deleteProfileImageFromDB = async (userId) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        profileImage: ""
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  ).select("-password").lean();
  const safeUpdatedUser = ensureUserExists(updatedUser);
  return formatProfileResponse(safeUpdatedUser);
};
var profileService = {
  getMyProfileFromDB,
  updateBasicProfileIntoDB,
  updateBioIntoDB,
  upsertSocialLinkIntoDB,
  deleteSocialLinkFromDB,
  updateMarketingChannelsIntoDB,
  updateProfileImageIntoDB,
  deleteProfileImageFromDB
};

// src/modules/profile/profile.validation.ts
import { z as z7 } from "zod";
var SOCIAL_LINK_PLATFORMS = [
  "linkedin",
  "facebook",
  "twitter",
  "instagram",
  "website"
];
var updateBasicProfileValidation = z7.object({
  body: z7.object({
    fullName: z7.string().trim().min(2).max(100).optional(),
    brokerage: z7.string().trim().max(100).optional(),
    phone: z7.string().trim().max(30).optional(),
    city: z7.string().trim().max(100).optional(),
    country: z7.string().trim().max(100).optional()
  }).strict().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  })
});
var updateBioValidation = z7.object({
  body: z7.object({
    bio: z7.string().trim().max(1e3)
  }).strict()
});
var upsertSocialLinkValidation = z7.object({
  body: z7.object({
    platform: z7.enum(SOCIAL_LINK_PLATFORMS),
    url: z7.string().trim().url("Invalid social link URL").max(500)
  }).strict()
});
var deleteSocialLinkValidation = z7.object({
  params: z7.object({
    platform: z7.enum(SOCIAL_LINK_PLATFORMS)
  })
});
var updateMarketingChannelsValidation = z7.object({
  body: z7.object({
    marketingChannels: z7.array(z7.string().trim().min(1).max(80)).max(20).transform((channels) => [...new Set(channels)])
  }).strict()
});

// src/modules/profile/profile.controller.ts
var throwError7 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var getAuthenticatedUserId = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  if (typeof req.user.id !== "string") {
    throw new UnauthorizedError("Invalid authenticated user");
  }
  return req.user.id;
};
var getMyProfile = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await profileService.getMyProfileFromDB(userId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Profile retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateBasicProfile = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const validatedData = updateBasicProfileValidation.parse({
      body: req.body
    });
    const result = await profileService.updateBasicProfileIntoDB(
      userId,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Basic profile updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateBio = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const validatedData = updateBioValidation.parse({
      body: req.body
    });
    const result = await profileService.updateBioIntoDB(
      userId,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Bio updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var upsertSocialLink = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const validatedData = upsertSocialLinkValidation.parse({
      body: req.body
    });
    const result = await profileService.upsertSocialLinkIntoDB(
      userId,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Social link saved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteSocialLink = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const validatedData = deleteSocialLinkValidation.parse({
      params: req.params
    });
    const result = await profileService.deleteSocialLinkFromDB(
      userId,
      validatedData.params.platform
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Social link deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateMarketingChannels = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const validatedData = updateMarketingChannelsValidation.parse({
      body: req.body
    });
    const result = await profileService.updateMarketingChannelsIntoDB(
      userId,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Marketing channels updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateProfileImage = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const file = req.file;
    if (!file) {
      throwError7("Profile image is required", 400);
    }
    const result = await profileService.updateProfileImageIntoDB(userId, file);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Profile image updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteProfileImage = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await profileService.deleteProfileImageFromDB(userId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Profile image deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var profileController = {
  getMyProfile,
  updateBasicProfile,
  updateBio,
  upsertSocialLink,
  deleteSocialLink,
  updateMarketingChannels,
  updateProfileImage,
  deleteProfileImage
};

// src/modules/profile/profile.route.ts
var router9 = Router9();
router9.use(verifyToken2);
router9.get("/me", profileController.getMyProfile);
router9.patch("/me/basic", profileController.updateBasicProfile);
router9.patch("/me/bio", profileController.updateBio);
router9.patch("/me/social-links", profileController.upsertSocialLink);
router9.delete(
  "/me/social-links/:platform",
  profileController.deleteSocialLink
);
router9.patch(
  "/me/marketing-channels",
  profileController.updateMarketingChannels
);
router9.patch(
  "/me/image",
  upload.single("profileImage"),
  profileController.updateProfileImage
);
router9.delete("/me/image", profileController.deleteProfileImage);
var profileRoutes = router9;

// src/modules/discount/discount.route.ts
import { Router as Router10 } from "express";

// src/modules/discount/discount.validation.ts
import { z as z8 } from "zod";
var createDiscountCodeValidation = z8.object({
  body: z8.object({
    code: z8.string().trim().min(2).max(50),
    discountPercent: z8.number().min(1).max(100),
    allowedRoles: z8.array(
      z8.enum([
        "associate",
        "partner",
        "ambassador",
        "ceo",
        "ceo_partner",
        "we_club_member"
      ])
    ).optional(),
    allowedAccessTo: z8.array(z8.enum(["we_command_center", "invictus", "both"])).optional(),
    maxRedemptionsPerRole: z8.number().int().positive().optional(),
    expiresAt: z8.string().datetime().optional(),
    note: z8.string().trim().max(500).optional()
  })
});
var validateDiscountCodeValidation = z8.object({
  query: z8.object({
    code: z8.string().trim().min(2).max(50),
    role: z8.enum([
      "associate",
      "partner",
      "ambassador",
      "ceo",
      "ceo_partner",
      "we_club_member"
    ]),
    accessTo: z8.enum(["we_command_center", "invictus", "both"])
  })
});
var sendDiscountCodeEmailValidation = z8.object({
  body: z8.object({
    email: z8.string().email(),
    code: z8.string().trim().min(2).max(50)
  })
});

// src/modules/discount/discount.controller.ts
var getAuthUserId2 = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  return req.user.id;
};
var createDiscountCode = async (req, res, next) => {
  try {
    const adminId = getAuthUserId2(req);
    const validatedData = createDiscountCodeValidation.parse({
      body: req.body
    });
    const result = await discountService.createDiscountCodeIntoDB(
      validatedData.body,
      adminId
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Discount code created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllDiscountCodes = async (_req, res, next) => {
  try {
    const result = await discountService.getAllDiscountCodesFromDB();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Discount codes retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var validateDiscountCode = async (req, res, next) => {
  try {
    const validatedData = validateDiscountCodeValidation.parse({
      query: req.query
    });
    const result = await discountService.validateDiscountCodeForCheckout({
      code: validatedData.query.code,
      role: validatedData.query.role,
      accessTo: validatedData.query.accessTo
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Discount code is valid",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var sendDiscountCodeEmail = async (req, res, next) => {
  try {
    const validatedData = sendDiscountCodeEmailValidation.parse({
      body: req.body
    });
    const result = await discountService.sendDiscountCodeByEmail(
      validatedData.body.email,
      validatedData.body.code
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Discount code email sent successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var discountController = {
  createDiscountCode,
  getAllDiscountCodes,
  validateDiscountCode,
  sendDiscountCodeEmail
};

// src/modules/discount/discount.route.ts
var router10 = Router10();
router10.get("/validate", discountController.validateDiscountCode);
router10.use(verifyToken2);
router10.use(authorizeRoles("admin", "manager"));
router10.post("/", discountController.createDiscountCode);
router10.get("/", discountController.getAllDiscountCodes);
router10.post("/send-email", discountController.sendDiscountCodeEmail);
var discountRoutes = router10;

// src/routes/index.ts
var router11 = Router11();
var moduleRoutes = [
  {
    path: "/admin",
    route: adminRoutes
  },
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
  },
  {
    path: "/commission",
    route: commissionLedgerRoutes
  },
  {
    path: "/listing-assets",
    route: listingAssetsRoutes
  },
  {
    path: "/payments",
    route: paymentRoutes
  },
  {
    path: "/profile",
    route: profileRoutes
  },
  {
    path: "/discounts",
    route: discountRoutes
  }
];
moduleRoutes.forEach((route) => {
  router11.use(route.path, route.route);
});
var routes_default = router11;

// src/swagger/swagger.ts
import swaggerJSDoc from "swagger-jsdoc";
var definition = {
  openapi: "3.0.3",
  info: {
    title: "We-Club Updated API",
    version: "1.0.0",
    description: 'API documentation for the We-Club backend \u2014 a real estate listing & referral commission platform. Use the "Authorize" button below and paste your JWT access token to call protected endpoints.',
    contact: {
      name: "We-Club"
    }
  },
  servers: [
    {
      url: "/api/v1",
      description: "Base API (relative to current host)"
    }
  ],
  tags: [
    { name: "Auth", description: "Login, signup, and password management" },
    { name: "Users", description: "User listing & profile lookup" },
    { name: "Admin", description: "Admin-only user management actions" },
    { name: "Listings", description: "Property listings" },
    { name: "Listing Promote Requests", description: "Requests to promote a listing" },
    { name: "Commission Ledger", description: "Referral commission tracking" },
    { name: "Listing Assets", description: "Downloadable listing asset packages & logs" },
    { name: "Payments", description: "Stripe pricing, checkout & webhook" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Something went wrong" },
          errorDetails: { type: "object", nullable: true }
        }
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
          data: { type: "object", nullable: true }
        }
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "665f1a2b3c4d5e6f7a8b9c0d" },
          fullName: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: {
            type: "string",
            enum: [
              "admin",
              "manager",
              "ceo",
              "ceo_partner",
              "associate",
              "partner",
              "ambassador",
              "we_club_member"
            ]
          },
          licenseNumber: { type: "string", nullable: true },
          brokerage: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          country: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          profileImage: { type: "string", nullable: true },
          paymentStatus: {
            type: "string",
            enum: ["unpaid", "paid", "failed", "refunded", "expired"]
          },
          approvalStatus: {
            type: "string",
            enum: ["pending", "approved", "rejected"]
          },
          accountStatus: {
            type: "string",
            enum: ["active", "pending_payment", "pending_approval", "suspended", "rejected"]
          },
          licenseVerificationStatus: {
            type: "string",
            enum: ["pending", "verified", "rejected"]
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      SignupRequest: {
        type: "object",
        required: ["fullName", "email", "password", "role"],
        properties: {
          fullName: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", format: "password", example: "StrongPass123!" },
          role: {
            type: "string",
            enum: [
              "admin",
              "manager",
              "ceo",
              "ceo_partner",
              "associate",
              "partner",
              "ambassador",
              "we_club_member"
            ]
          },
          phone: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          country: { type: "string", nullable: true },
          licenseNumber: { type: "string", nullable: true },
          brokerage: { type: "string", nullable: true }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", format: "password", example: "StrongPass123!" }
        }
      },
      AuthTokenResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful" },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
              user: { $ref: "#/components/schemas/User" }
            }
          }
        }
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["oldPassword", "newPassword"],
        properties: {
          oldPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password" }
        }
      },
      ForgetPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" }
        }
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["newPassword"],
        properties: {
          newPassword: { type: "string", format: "password" }
        }
      },
      Location: {
        type: "object",
        properties: {
          city: { type: "string", example: "Dhaka" },
          region: { type: "string", example: "Dhaka Division" },
          country: { type: "string", example: "Bangladesh" }
        }
      },
      Price: {
        type: "object",
        properties: {
          amount: { type: "number", example: 25e4 },
          currency: { type: "string", example: "USD" }
        }
      },
      ReferralCommission: {
        type: "object",
        properties: {
          offered_amount: { type: "number", example: 5 },
          confirmed_amount: { type: "number", nullable: true, example: 4.5 }
        }
      },
      Listing: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string", example: "Modern 3BR Apartment in Gulshan" },
          ref_code: { type: "string", example: "WC-10234" },
          status: { type: "string", enum: ["active", "pending", "sold", "draft"] },
          location: { $ref: "#/components/schemas/Location" },
          price: { $ref: "#/components/schemas/Price" },
          bedrooms: { type: "number", example: 3 },
          bathrooms: { type: "number", example: 2 },
          area_sqm: { type: "number", example: 145 },
          referral_commission: { $ref: "#/components/schemas/ReferralCommission" },
          cover_image: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          associate_id: { type: "string" },
          promoters: { type: "array", items: { type: "string" } },
          is_deleted: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      CreateListingRequest: {
        type: "object",
        required: ["title", "location", "price", "bedrooms", "bathrooms", "area_sqm"],
        properties: {
          title: { type: "string", example: "Modern 3BR Apartment in Gulshan" },
          location: {
            type: "string",
            description: 'JSON string of Location object, e.g. {"city":"Dhaka","region":"Dhaka Division","country":"Bangladesh"}'
          },
          price: {
            type: "string",
            description: 'JSON string of Price object, e.g. {"amount":250000,"currency":"USD"}'
          },
          referral_commission: {
            type: "string",
            description: 'JSON string of ReferralCommission object, e.g. {"offered_amount":5}'
          },
          bedrooms: { type: "number", example: 3 },
          bathrooms: { type: "number", example: 2 },
          area_sqm: { type: "number", example: 145 },
          cover_image: { type: "string", format: "binary" },
          images: {
            type: "array",
            items: { type: "string", format: "binary" }
          }
        }
      },
      PromoteRequest: {
        type: "object",
        properties: {
          _id: { type: "string" },
          listing_id: { type: "string" },
          requester_id: { type: "string" },
          proposed_commission_pct: { type: "number", example: 4.5 },
          confirmed_commission_pct: { type: "number", nullable: true },
          marketing_channels: { type: "array", items: { type: "string" } },
          message: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected", "cancelled"]
          },
          requested_at: { type: "string", format: "date-time" },
          resolved_at: { type: "string", format: "date-time", nullable: true }
        }
      },
      CreatePromoteRequest: {
        type: "object",
        required: ["listing_id", "proposed_commission_pct"],
        properties: {
          listing_id: { type: "string" },
          proposed_commission_pct: { type: "number", example: 4.5 },
          marketing_channels: { type: "array", items: { type: "string" } },
          message: { type: "string", nullable: true }
        }
      },
      ManagePromoteRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["approved", "rejected"] },
          confirmed_commission_pct: { type: "number", nullable: true },
          listing_id: { type: "string" }
        }
      },
      CommissionLedger: {
        type: "object",
        properties: {
          _id: { type: "string" },
          listing_id: { type: "string" },
          promotion_request_id: { type: "string", nullable: true },
          listing_owner_id: { type: "string" },
          promoter_id: { type: "string" },
          created_by: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "paid", "disputed", "cancelled"]
          },
          currency: { type: "string", example: "USD" },
          listing_price_amount: { type: "number" },
          commission_rate_percent: { type: "number" },
          estimated_commission_amount: { type: "number" },
          final_commission_amount: { type: "number", nullable: true },
          deal_closed_at: { type: "string", format: "date-time", nullable: true },
          is_frozen: { type: "boolean" },
          note: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      CreateManualCommissionRequest: {
        type: "object",
        required: ["listing_id", "listing_owner_id", "promoter_id", "listing_price_amount", "commission_rate_percent"],
        properties: {
          listing_id: { type: "string" },
          promotion_request_id: { type: "string", nullable: true },
          listing_owner_id: { type: "string" },
          promoter_id: { type: "string" },
          currency: { type: "string", example: "USD" },
          listing_price_amount: { type: "number" },
          commission_rate_percent: { type: "number" },
          note: { type: "string", nullable: true }
        }
      },
      MarkPaidRequest: {
        type: "object",
        properties: {
          payment_method: {
            type: "string",
            enum: ["bank_transfer", "stripe", "helcim", "cash", "check", "other"]
          },
          payment_reference: { type: "string", nullable: true },
          note: { type: "string", nullable: true }
        }
      },
      DisputeRequest: {
        type: "object",
        required: ["reason"],
        properties: {
          reason: { type: "string", example: "Amount does not match agreed rate" }
        }
      },
      ResolveDisputeRequest: {
        type: "object",
        required: ["resolution_note"],
        properties: {
          resolution_note: { type: "string" },
          final_commission_amount: { type: "number", nullable: true }
        }
      },
      ApprovalStatusRequest: {
        type: "object",
        required: ["approvalStatus"],
        properties: {
          approvalStatus: { type: "string", enum: ["pending", "approved", "rejected"] },
          rejectedReason: { type: "string", nullable: true }
        }
      },
      LicenseVerificationStatusRequest: {
        type: "object",
        required: ["licenseVerificationStatus"],
        properties: {
          licenseVerificationStatus: { type: "string", enum: ["pending", "verified", "rejected"] }
        }
      },
      AccountStatusRequest: {
        type: "object",
        required: ["accountStatus"],
        properties: {
          accountStatus: {
            type: "string",
            enum: ["active", "pending_payment", "pending_approval", "suspended", "rejected"]
          }
        }
      },
      PricingItem: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string", example: "usd" },
          interval: { type: "string", enum: ["month", "year"] },
          formattedAmount: { type: "string", example: "$49.00" },
          billingText: { type: "string", example: "$49.00 / month" }
        }
      },
      RolePricingPlan: {
        type: "object",
        properties: {
          role: { type: "string" },
          displayName: { type: "string" },
          requiresPayment: { type: "boolean" },
          items: { type: "array", items: { $ref: "#/components/schemas/PricingItem" } },
          totalFirstPayment: { type: "number" },
          totalFirstPaymentFormatted: { type: "string" }
        }
      },
      UpgradeCheckoutRequest: {
        type: "object",
        required: ["targetRole"],
        properties: {
          targetRole: {
            type: "string",
            enum: [
              "admin",
              "manager",
              "ceo",
              "ceo_partner",
              "associate",
              "partner",
              "ambassador",
              "we_club_member"
            ]
          }
        }
      },
      CheckoutSessionResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              checkoutUrl: { type: "string", example: "https://checkout.stripe.com/c/pay/cs_test_..." },
              sessionId: { type: "string", example: "cs_test_a1b2c3" }
            }
          }
        }
      },
      ListingAssetDownloadLog: {
        type: "object",
        properties: {
          _id: { type: "string" },
          listing_id: { type: "string" },
          downloaded_by: { type: "string" },
          ip_address: { type: "string", nullable: true },
          user_agent: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};
var options = {
  definition,
  apis: [
    "./src/modules/**/*.route.ts",
    "./src/modules/**/*.docs.ts",
    "./dist/modules/**/*.route.js",
    "./dist/modules/**/*.docs.js"
  ]
};
var swaggerSpec = swaggerJSDoc(options);

// src/app.ts
var app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello World Bro!");
});
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "We-Club API Docs"
  })
);
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api/v1", routes_default);
app.use(routeNotFoundHandler_default);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var port = process.env.PORT || 3e3;
var main = async () => {
  try {
    await mongoose2.connect(config_default.MONGO_URI);
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