
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/server.ts
import mongoose6 from "mongoose";

// src/app.ts
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
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
import { Router as Router48 } from "express";

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
  // Escapes characters that have special meaning in a regex (. * + ? ( ) [
  // ] { } ^ $ |) so a search term is always treated as literal text, never
  // as regex syntax. Without this, searching something like "Dr. Smith" or
  // "C++" would have those symbols interpreted as regex operators instead
  // of literal characters — silently breaking matches for real names — and
  // more importantly, it means arbitrary user input flows straight into a
  // MongoDB regex unescaped, which is a real injection/ReDoS surface.
  //
  // Public (not private) so any other service can reuse it directly, e.g.
  // when it needs to search a REFERENCED collection first — you can't
  // filter Promoter by a populated User field via a plain .find(), so
  // getPromotersFromDB resolves matching User _ids itself first, and needs
  // this same escaping for that separate query:
  //   QueryBuilder.escapeRegex(searchTerm)
  static escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  search(searchableFields) {
    const searchTerm = this.query.search?.trim();
    if (searchTerm) {
      const safeSearchTerm = _QueryBuilder.escapeRegex(searchTerm);
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: safeSearchTerm, $options: "i" }
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
  "founder",
  "super_admin",
  "community_manager",
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
var MEMBERSHIP_DURATIONS = [3, 6, 12];
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
var MEMBERSHIP_ACCESS_STATUSES = [
  "pending",
  "active",
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
    membershipDurationMonths: {
      type: Number,
      enum: MEMBERSHIP_DURATIONS
    },
    membershipAccessStatus: {
      type: String,
      enum: MEMBERSHIP_ACCESS_STATUSES,
      default: "pending",
      index: true
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

// src/modules/users/user.validation.ts
import { z } from "zod";
var emailSchema = z.string().trim().min(1, { message: "Email is required" }).refine(
  (value) => {
    const normalized = value.toLowerCase();
    return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
      normalized
    );
  },
  { message: "Please enter a valid email address" }
).transform((value) => value.toLowerCase());
var passwordSchema = z.string().trim().min(8, { message: "Password must be at least 8 characters" }).max(100, { message: "Password must be at most 100 characters" });
var registerValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum([
      "founder",
      "manager",
      "community_manager",
      "super_admin",
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
    discountCode: z.string().trim().optional(),
    membershipDurationMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]).optional()
  })
});
var loginValidation = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema
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
var createManagerByAdminValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(["manager"]),
    accessTo: z.enum([
      "we_command_center",
      "invictus",
      "both"
    ])
  })
});
var createAdminAccountValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    // ekhane sob possible creatable role rakhlam,
    // kon requester kon role banate parbe seta service e check hobe
    role: z.enum(["manager", "super_admin", "community_manager"]),
    accessTo: z.enum(["we_command_center", "invictus", "both"])
  })
});

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
var BadRequestError = class extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.name = "BadRequestError";
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

// src/utility/passwordUtil.ts
import bcrypt from "bcryptjs";

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
  RESEND_API_KEY: process.env.RESEND_API_KEY,
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
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY: process.env.STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY,
  STRIPE_PRICE_INVICTUS_MONTHLY: process.env.STRIPE_PRICE_INVICTUS_MONTHLY,
  STRIPE_PRICE_BOTH_MONTHLY: process.env.STRIPE_PRICE_BOTH_MONTHLY,
  STRIPE_PRICE_CEO_YEARLY: process.env.STRIPE_PRICE_CEO_YEARLY,
  STRIPE_PRICE_CEO_PARTNER_YEARLY: process.env.STRIPE_PRICE_CEO_PARTNER_YEARLY,
  STRIPE_PRICE_WE_CLUB_MEMBER_MONTHLY: process.env.STRIPE_PRICE_WE_CLUB_MEMBER_MONTHLY
};

// src/utility/passwordUtil.ts
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

// src/modules/users/auth.service.ts
var CREATABLE_ROLES_BY_ROLE = {
  founder: ["manager", "super_admin", "community_manager"],
  manager: ["super_admin", "community_manager"]
};
var getAllUsersFromDB = async (query) => {
  const { role, ...restQuery } = query;
  let baseFilter = {};
  if (role) {
    const roleList = String(role).split(",").map((r) => r.trim()).filter(Boolean);
    if (roleList.length > 1) {
      baseFilter.role = { $in: roleList };
    } else if (roleList.length === 1) {
      baseFilter.role = roleList[0];
    }
  }
  const userQuery = new queryBuilder_default(
    User.find(baseFilter).select("-password"),
    restQuery
  ).search(["fullName", "email"]).filter().sort().paginate();
  const data = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return {
    data,
    meta
  };
};
var getSingleUserFromDB = async (id3) => {
  const user = await User.findById(id3);
  return user;
};
var createAdminAccount = async (payload, requesterId, requesterRole) => {
  const { body } = createAdminAccountValidation.parse({
    body: payload
  });
  const allowedRoles = CREATABLE_ROLES_BY_ROLE[requesterRole];
  if (!allowedRoles || !allowedRoles.includes(body.role)) {
    throw new Error(
      `You are not permitted to create a '${body.role}' account.`
    );
  }
  const existingUser = await User.findOne({ email: body.email });
  if (existingUser) {
    throw new ExistingUserError("User already exists");
  }
  const hashedPassword = await hashPassword(body.password);
  const user = await User.create({
    fullName: body.fullName,
    email: body.email,
    password: hashedPassword,
    role: body.role,
    accessTo: body.accessTo,
    paymentStatus: "paid",
    subscriptionStatus: "active",
    approvalStatus: "approved",
    accountStatus: "active",
    licenseVerificationStatus: "verified",
    approvedBy: requesterId,
    approvedAt: /* @__PURE__ */ new Date()
  });
  const userObject = user.toObject();
  const { password, ...safeUser } = userObject;
  return safeUser;
};
var activateManagerByAdmin = async (id3) => {
  const user = await User.findById(id3);
  if (!user) {
    throw new Error("User not found.");
  }
  if (!["manager", "super_admin", "community_manager"].includes(user.role)) {
    throw new Error("Only admin accounts can be activated.");
  }
  if (user.accountStatus === "active") {
    throw new Error("Account is already active.");
  }
  user.accountStatus = "active";
  user.approvalStatus = "approved";
  user.paymentStatus = "paid";
  user.subscriptionStatus = "active";
  user.licenseVerificationStatus = "verified";
  await user.save();
  const userObject = user.toObject();
  const { password, ...safeUser } = userObject;
  return safeUser;
};
var suspendManagerByAdmin = async (id3) => {
  const user = await User.findById(id3);
  if (!user) {
    throw new Error("User not found.");
  }
  if (!["manager", "super_admin", "community_manager"].includes(user.role)) {
    throw new Error("Only admin accounts can be suspended.");
  }
  if (user.accountStatus === "suspended") {
    throw new Error("Account is already suspended.");
  }
  user.accountStatus = "suspended";
  await user.save();
  const userObject = user.toObject();
  const { password, ...safeUser } = userObject;
  return safeUser;
};
var deleteManagerByAdmin = async (id3) => {
  const user = await User.findById(id3);
  if (!user) {
    throw new Error("User not found.");
  }
  if (user.role === "founder") {
    throw new Error("The Founder account cannot be deleted.");
  }
  await User.findByIdAndDelete(id3);
  return null;
};
var userService = {
  getAllUsersFromDB,
  getSingleUserFromDB,
  createAdminAccount,
  deleteManagerByAdmin,
  suspendManagerByAdmin,
  activateManagerByAdmin
};

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
var getSingleParamId = (value) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};
var getAllUsers = async (req, res, next) => {
  try {
    const query = req.query;
    const result = await userService.getAllUsersFromDB(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Users retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleUser = async (req, res, next) => {
  try {
    const id3 = getSingleParamId(req.params.id);
    if (!id3) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid user id",
        data: null
      });
    }
    const result = await userService.getSingleUserFromDB(id3);
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
var createManagerByAdmin = async (req, res, next) => {
  try {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const result = await userService.createAdminAccount(
      req.body,
      requesterId,
      requesterRole
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Account created successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteManagerByAdmin2 = async (req, res, next) => {
  try {
    const id3 = getSingleParamId(req.params.id);
    if (!id3) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid manager id",
        data: null
      });
    }
    await userService.deleteManagerByAdmin(id3);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Manager deleted successfully.",
      data: null
    });
  } catch (error) {
    next(error);
  }
};
var activateManagerByAdmin2 = async (req, res, next) => {
  try {
    const id3 = getSingleParamId(req.params.id);
    if (!id3) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid manager id",
        data: null
      });
    }
    const result = await userService.activateManagerByAdmin(id3);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Manager activated successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var suspendManagerByAdmin2 = async (req, res, next) => {
  try {
    const id3 = getSingleParamId(req.params.id);
    if (!id3) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid manager id",
        data: null
      });
    }
    const result = await userService.suspendManagerByAdmin(id3);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Manager suspended successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var userController = { getAllUsers, getSingleUser, createManagerByAdmin, deleteManagerByAdmin: deleteManagerByAdmin2, suspendManagerByAdmin: suspendManagerByAdmin2, activateManagerByAdmin: activateManagerByAdmin2 };

// src/middleware/authMiddleware.ts
import jwt from "jsonwebtoken";
var verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) {
    return next(new UnauthorizedError("Authentication token is required"));
  }
  try {
    const decoded = jwt.verify(token, config_default.JWT_ACCESS_SECRET);
    if (!decoded || !decoded.id || !decoded.role) {
      return next(new UnauthorizedError("Invalid token payload"));
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      accessTo: decoded.accessTo,
      membershipAccessStatus: decoded.membershipAccessStatus
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
  if (req.user.role !== "founder") {
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

// src/modules/users/user.route.ts
var router = Router();
router.get("/", verifyToken, userController.getAllUsers);
router.get("/:id", userController.getSingleUser);
router.post(
  "/admin-create",
  verifyToken,
  authorizeRoles("founder", "manager"),
  userController.createManagerByAdmin
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("founder"),
  userController.deleteManagerByAdmin
);
router.patch(
  "/:id/suspend",
  verifyToken,
  authorizeRoles("founder", "manager"),
  userController.suspendManagerByAdmin
);
router.patch(
  "/:id/activate",
  verifyToken,
  authorizeRoles("founder", "manager"),
  userController.activateManagerByAdmin
);
var userRoutes = router;

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import jwt3 from "jsonwebtoken";
import crypto from "crypto";

// src/modules/auth/auth.utils.ts
import jwt2 from "jsonwebtoken";
var createToken = (jwtPayload, secret, expiresInSeconds) => {
  return jwt2.sign(jwtPayload, secret, { expiresIn: expiresInSeconds });
};
var verifyToken2 = (token, secret) => {
  return jwt2.verify(token, secret);
};

// src/utility/SendMail.ts
import { Resend } from "resend";
var resend = new Resend(config_default.RESEND_API_KEY);
var sendMail = async (to, html) => {
  const fromEmail = config_default.MAIL_FROM_NAME ? `${config_default.MAIL_FROM_NAME} <onboarding@resend.dev>` : "onboarding@resend.dev";
  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Change Password",
    text: "Reset your Password within 10 minutes",
    html
  });
  if (error) {
    console.error("Resend email send failed:", error);
    throw new Error(error.message || "Failed to send email");
  }
};
var SendMail_default = sendMail;

// src/utility/sendCalendlyMeeting.ts
import nodemailer from "nodemailer";
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
  return nodemailer.createTransport({
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
var isPaidRole = (role) => {
  return [
    "associate",
    "partner",
    "ambassador",
    "ceo",
    "ceo_partner",
    "we_club_member"
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
      " "
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
var getPricingByRoleAndAccess = (role, accessTo, durationMonths = 3) => {
  let displayName = "";
  let items = [];
  if (role === "ceo" || role === "ceo_partner") {
    const isCeo = role === "ceo";
    displayName = isCeo ? "CEO Club Membership" : "CEO Partner Membership";
    const yearlyPrice = parseDollarAmountToCents(
      isCeo ? config_default.STRIPE_PRICE_CEO_YEARLY : config_default.STRIPE_PRICE_CEO_PARTNER_YEARLY,
      isCeo ? "STRIPE_PRICE_CEO_YEARLY" : "STRIPE_PRICE_CEO_PARTNER_YEARLY"
    );
    items = [
      {
        name: displayName,
        description: "12 month W\xC9 Command Center + INVICTUS Academy membership.",
        amountCents: yearlyPrice,
        amount: yearlyPrice / 100,
        currency: "usd",
        interval: "year",
        formattedAmount: formatAmount(yearlyPrice),
        billingText: `${formatAmount(yearlyPrice)} / 12 months`
      }
    ];
    return {
      role,
      accessTo: "both",
      displayName,
      requiresPayment: true,
      items,
      totalFirstPaymentCents: yearlyPrice,
      totalFirstPayment: yearlyPrice / 100,
      totalFirstPaymentFormatted: formatAmount(yearlyPrice)
    };
  }
  const accessName = getAccessDisplayName(accessTo);
  if (role === "we_club_member") {
    displayName = `WE CLUB MEMBER - ${accessName}`;
    const monthlyPrice = parseDollarAmountToCents(
      config_default.STRIPE_PRICE_WE_CLUB_MEMBER_MONTHLY,
      "STRIPE_PRICE_WE_CLUB_MEMBER_MONTHLY"
    );
    const totalPrice = monthlyPrice * durationMonths;
    items = [
      {
        name: displayName,
        description: `${durationMonths} month WE Club membership access to ${accessName}.`,
        amountCents: totalPrice,
        amount: totalPrice / 100,
        currency: "usd",
        interval: "month",
        formattedAmount: formatAmount(totalPrice),
        billingText: `${formatAmount(totalPrice)} / ${durationMonths} months`
      }
    ];
  }
  if (["associate", "partner", "ambassador"].includes(role)) {
    displayName = `${role.toUpperCase()} - ${accessName}`;
    const monthlyPrice = getMemberAccessPrice(accessTo);
    const totalPrice = monthlyPrice * durationMonths;
    items = [
      {
        name: displayName,
        description: `${durationMonths} month access to ${accessName}.`,
        amountCents: totalPrice,
        amount: totalPrice / 100,
        currency: "usd",
        interval: "month",
        formattedAmount: formatAmount(totalPrice),
        billingText: `${formatAmount(totalPrice)} / ${durationMonths} months`
      }
    ];
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
    totalFirstPaymentFormatted: formatAmount(
      totalFirstPaymentCents
    )
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
    "ceo_partner",
    "we_club_member"
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

// src/modules/payment/registrationPaymentLink.model.ts
import { Schema as Schema2, model as model2 } from "mongoose";
var REGISTRATION_PAYMENT_LINK_STATUSES = [
  "active",
  "checkout_created",
  "paid",
  "revoked"
];
var registrationPaymentLinkSchema = new Schema2(
  {
    user: {
      type: Schema2.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: REGISTRATION_PAYMENT_LINK_STATUSES,
      default: "active",
      index: true
    },
    stripeCheckoutSessionId: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);
var RegistrationPaymentLink = model2(
  "RegistrationPaymentLink",
  registrationPaymentLinkSchema
);

// src/utility/membership/membership.service.ts
var syncMembershipExpiry = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }
  if (user.membershipAccessStatus === "active" && user.subscriptionExpiresAt && user.subscriptionExpiresAt <= /* @__PURE__ */ new Date()) {
    user.membershipAccessStatus = "expired";
    user.subscriptionStatus = "expired";
    user.paymentStatus = "expired";
    await user.save();
  }
  return user;
};

// src/modules/auth/auth.service.ts
var createUser = async (payload) => {
  const { body } = registerValidation.parse({
    body: payload
  });
  const existingUser = await User.findOne({
    email: body.email
  });
  if (existingUser) {
    throw new ExistingUserError("User already exists");
  }
  const hashedPassword = await hashPassword(body.password);
  const requiresPayment = isPaidRole(body.role);
  const isCeoRole = body.role === "ceo" || body.role === "ceo_partner";
  const resolvedAccessTo = isCeoRole ? "both" : body.accessTo;
  const resolvedDuration = isCeoRole ? 12 : body.membershipDurationMonths;
  if (requiresPayment && !resolvedDuration) {
    throw new Error(
      "Membership duration is required. Please select 3, 6 or 12 months."
    );
  }
  const userPayload = {
    fullName: body.fullName,
    email: body.email,
    role: body.role,
    accessTo: resolvedAccessTo,
    membershipDurationMonths: resolvedDuration,
    membershipAccessStatus: requiresPayment ? "pending" : "active",
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
  try {
    if (requiresPayment) {
      const paymentToken = crypto.randomBytes(32).toString("hex");
      await RegistrationPaymentLink.create({
        user: user._id,
        token: paymentToken,
        status: "active"
      });
    }
    try {
      await sendCalendlyMeetingMail({
        fullName: user.fullName,
        email: user.email,
        role: user.role
      });
    } catch (mailError) {
      console.error(
        "Calendly mail failed:",
        mailError
      );
    }
    const userObject = user.toObject();
    const {
      password: _password,
      ...safeUserObject
    } = userObject;
    return {
      user: safeUserObject,
      checkoutUrl: null,
      message: requiresPayment ? "Registration completed. Your payment link will be provided after review." : "User created successfully. Waiting for admin approval."
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
  await syncMembershipExpiry(
    user._id.toString()
  );
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
    accessTo: user.accessTo,
    membershipAccessStatus: user.membershipAccessStatus
  };
  const accessToken = jwt3.sign(
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
  const resetUILink = `https://we-club.onrender.com/reset-password?token=${token}`;
  SendMail_default(user?.email, `<p> ${resetUILink}</p>`);
};
var resetPassword = async (payload, token) => {
  const decoded = verifyToken2(
    token,
    config_default.JWT_ACCESS_SECRET
  );
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ExistingUserError("User not found");
  }
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
  const decoded = verifyToken2(token, config_default.JWT_REFRESH_SECRET);
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
  const accessToken = jwt3.sign(
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
    await schema.parseAsync({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
      cookies: req.cookies ?? {}
    });
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

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/login", authController.loginUserInDB);
router2.post("/signup", authController.createUserInDB);
router2.post("/change-password", verifyToken, validateRequest_default(AuthValidations.changePasswordValidationSchema), authController.changePassword);
router2.post("/forget-password", validateRequest_default(AuthValidations.forgetPasswordValidationSchema), authController.forgetPassword);
router2.post("/reset-password", validateRequest_default(AuthValidations.resetPasswordValidationSchema), authController.resetPassword);
router2.post("/refresh-token", validateRequest_default(AuthValidations.refreshTokenValidationSchema), authController.refreshtoken);
var authRoutes = router2;

// src/modules/listings/listings.route.ts
import { Router as Router3 } from "express";

// src/modules/listings/listings.model.schema.ts
import { Schema as Schema3, model as model3 } from "mongoose";
var LocationSchema = new Schema3(
  {
    city: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, required: true }
  },
  { _id: false }
);
var PriceSchema = new Schema3(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true }
  },
  { _id: false }
);
var AreaSchema = new Schema3(
  {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ["sqft", "sqm", "acre", "katha", "decimal", "bigha"]
    }
  },
  { _id: false }
);
var ReferralCommissionSchema = new Schema3(
  {
    offered_amount: { type: Number, required: true },
    confirmed_amount: { type: Number }
  },
  { _id: false }
);
var ListingSchema = new Schema3(
  {
    title: { type: String, required: true, trim: true },
    ref_code: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["active", "pending", "sold", "draft"],
      default: "pending"
    },
    location: { type: LocationSchema, required: true },
    price: { type: PriceSchema, required: true },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    area_sqm: {
      type: AreaSchema,
      required: true
    },
    referral_commission: { type: ReferralCommissionSchema, required: true },
    cover_image: { type: String, required: true },
    images: { type: [String], default: [] },
    associate_id: {
      type: Schema3.Types.ObjectId,
      ref: "User",
      required: true
    },
    promoters: {
      type: [
        {
          _id: false,
          user_id: { type: Schema3.Types.ObjectId, ref: "User" },
          tier: { type: String, enum: ["tier_1", "tier_2", "tier_3"] }
        }
      ],
      default: []
    },
    listings_view: {
      type: Number,
      default: 0
    },
    sold_at: {
      type: Date
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
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
ListingSchema.virtual("is_sale_finalized").get(function() {
  if (this.status !== "sold" || !this.sold_at) return false;
  const finalizationMs = 30 * 24 * 60 * 60 * 1e3;
  return Date.now() - this.sold_at.getTime() >= finalizationMs;
});
ListingSchema.index({ status: 1 });
ListingSchema.index({ "location.country": 1 });
ListingSchema.index({ associate_id: 1 });
ListingSchema.index({ is_deleted: 1 });
ListingSchema.index({ status: 1, sold_at: 1 });
ListingSchema.pre(/^find/, function() {
  if (this.getFilter().is_deleted === void 0) {
    this.where({ is_deleted: false });
  }
});
var Listing = model3("Listing", ListingSchema);

// src/modules/listingPromote/listings.promote.request.model.schema.ts
import { Schema as Schema4, model as model4 } from "mongoose";
var PromoteRequestSchema = new Schema4(
  {
    listing_id: {
      type: Schema4.Types.ObjectId,
      ref: "Listing",
      required: true
    },
    requester: {
      user: {
        type: Schema4.Types.ObjectId,
        ref: "User"
      },
      user_id: {
        type: Schema4.Types.ObjectId,
        ref: "User",
        require: true
      },
      email: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: [
        "pending",
        "owner_approved",
        "approved",
        "rejected",
        "promoter_rejected",
        "cancelled"
      ],
      default: "pending"
    },
    promoter_agreement_status: {
      type: String,
      enum: ["not_started", "pending", "accepted", "rejected"],
      default: "not_started"
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    proposed_commission_pct: {
      type: Number,
      // required: true,
      min: 0,
      max: 100
    },
    confirmed_commission_pct: {
      type: Number,
      min: 0,
      max: 100
    },
    marketing_channels: {
      type: [String],
      default: []
    },
    message: {
      type: String,
      trim: true
    },
    promoter_rejection_reason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    promoter_rejected_at: {
      type: Date
    },
    selected_tier: {
      type: String,
      enum: ["tier_1", "tier_2", "tier_3"],
      default: null
    },
    deleted_at: Date,
    requested_at: { type: Date, default: Date.now },
    resolved_at: { type: Date }
  },
  {
    timestamps: false
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
var PromoteRequest = model4(
  "PromoteRequest",
  PromoteRequestSchema
);

// src/modules/listings/listings.service.ts
import mongoose from "mongoose";

// src/modules/listings/listings.viewsHistory.modal.schema.ts
import { Schema as Schema5, model as model5, Types as Types3 } from "mongoose";
var listingViewStatsSchema = new Schema5(
  {
    listing: {
      type: Types3.ObjectId,
      ref: "Listing",
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);
listingViewStatsSchema.index(
  {
    listing: 1,
    date: 1
  },
  {
    unique: true
  }
);
var ListingViewStats = model5(
  "ListingViewStats",
  listingViewStatsSchema
);

// src/modules/listings/listings.service.ts
var generateRefCode = () => {
  const digits = Math.floor(1e5 + Math.random() * 9e5);
  return `WE-${digits}`;
};
var createListingInDB = async (payload, creatorRole) => {
  const { ref_code, ...safePayload } = payload;
  let attempts = 0;
  while (attempts < 5) {
    try {
      const listing = new Listing({
        ...safePayload,
        ref_code: generateRefCode(),
        ...creatorRole === "founder" && { status: "active" }
      });
      return await listing.save();
    } catch (error) {
      if (error.code === 11e3 && error.keyPattern?.ref_code) {
        attempts++;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate a unique reference code. Please try again.");
};
var getAllListingFromDB = async (query) => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query
  };
  const listingQuery = new queryBuilder_default(
    Listing.find().populate(
      "associate_id",
      "fullName email bio phone city country brokerage profileImage licenseNumber role accountStatus approvalStatus"
    ),
    queryWithDefaultSort
  ).search(["title", "ref_code", "location.country"]).filter().sort().paginate().fieldsLimit();
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
var getListingByIdFromDB = async (id3) => {
  return await Listing.findById(id3).populate("associate_id", "name email");
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
    { $unwind: "$promoters" },
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
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { fullName: 1, email: 1, phone: 1, _id: 0 } }]
      }
    },
    { $unwind: "$user" },
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
var updateListingInDB = async (id3, associateId, payload) => {
  const listing = await Listing.findById(id3);
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
  return await Listing.findByIdAndUpdate(id3, safePayload, {
    new: true,
    runValidators: true
  });
};
var deleteListingFromDB = async (id3, userId, role) => {
  const listing = await Listing.findById(id3);
  if (!listing) {
    throw new Error("Listing not found");
  }
  const isOwner = listing.associate_id.toString() === userId.toString();
  const isFounder = role === "founder";
  if (!isOwner && !isFounder) {
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
      { listing_id: id3, is_deleted: false },
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
var cancelPendingListingInDB = async (id3, userId) => {
  const listing = await Listing.findById(id3);
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
var deletePendingListingInDB = async (id3, userId) => {
  const listing = await Listing.findById(id3);
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
var manageListings = async (id3, status) => {
  const listing = await Listing.findById(id3);
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }
  listing.status = status;
  return await listing.save();
};
var incrementListingViewCountInDB = async (id3) => {
  const listing = await Listing.findByIdAndUpdate(
    id3,
    { $inc: { listings_view: 1 } },
    { new: true, select: "listings_view" }
  );
  await trackListingView(id3);
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }
  return listing;
};
var trackListingView = async (listingId) => {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  await Promise.all([
    Listing.findByIdAndUpdate(listingId, {
      $inc: {
        totalViews: 1
      }
    }),
    ListingViewStats.updateOne(
      {
        listing: listingId,
        date: today
      },
      {
        $inc: {
          views: 1
        }
      },
      {
        upsert: true
      }
    )
  ]);
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
  manageListings,
  incrementListingViewCountInDB
};

// src/utility/cloudinaryUpload.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: config_default.CLOUDINARY_CLOUD_NAME,
  api_key: config_default.CLOUDINARY_API_KEY,
  api_secret: config_default.CLOUDINARY_API_SECRET
});
var uploadImageToCloudinary = async (file, folder = "adam/profile-images") => {
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
var uploadLogoToCloudinary = async (file, folder = "adam/logo") => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;
  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "image"
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
      area_sqm: parseIfString(req.body.area_sqm),
      referral_commission: parseIfString(req.body.referral_commission)
    };
    const listing = await listingsService.createListingInDB(
      {
        ...body,
        ...cover_image && { cover_image },
        ...images.length > 0 && { images }
      },
      req.user?.role
    );
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
    const result = await listingsService.getMyListingFromDB(
      userId,
      query
    );
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
    const { id: id3 } = req.params;
    const result = await listingsService.getListingByIdFromDB(id3);
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
    const { id: id3 } = req.params;
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
    const results = await listingsService.updateListingInDB(
      id3,
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
    const { id: id3 } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;
    const results = await listingsService.deleteListingFromDB(
      id3,
      userId,
      role
    );
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
    const { id: id3 } = req.params;
    const userId = req.user?.id;
    const results = await listingsService.cancelPendingListingInDB(
      id3,
      userId
    );
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
    const { id: id3 } = req.params;
    const userId = req.user?.id;
    const results = await listingsService.deletePendingListingInDB(
      id3,
      userId
    );
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
    const { id: id3 } = req.params;
    const { status } = req.body;
    const results = await listingsService.manageListings(id3, status);
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
var incrementListingView = async (req, res, next) => {
  try {
    const { id: id3 } = req.params;
    const result = await listingsService.incrementListingViewCountInDB(
      id3
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "View recorded",
      data: result
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
  manageListings: manageListings2,
  incrementListingView
};

// src/middleware/uploadMiddleware.ts
import multer from "multer";
import path2 from "path";
var storage = multer.memoryStorage();
var allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
var allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
var upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const ext = path2.extname(file.originalname).toLowerCase();
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);
    const isExtValid = allowedExtensions.includes(ext);
    if (!isMimeValid && !isExtValid) {
      return cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"));
    }
    cb(null, true);
  }
});
var uploadListingImages = upload.fields([
  { name: "cover_image", maxCount: 1 },
  { name: "images", maxCount: 10 }
]);
var uploadRetreatImages = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "gallery", maxCount: 10 }
]);

// src/modules/listings/listings.route.ts
var router3 = Router3();
router3.get("/", listingController.getAllListing);
router3.post("/", verifyToken, uploadListingImages, listingController.createListing);
router3.get("/my", verifyToken, listingController.getMyListings);
router3.get("/my-promoters", verifyToken, listingController.getMyPromoters);
router3.post("/manage/:id", verifyToken, verifyAdmin, listingController.manageListings);
router3.put("/:id", verifyToken, uploadListingImages, listingController.updateListing);
router3.patch("/cancel/:id", verifyToken, listingController.cancelPendingListing);
router3.patch("/delete/:id", verifyToken, listingController.deletePendingListing);
router3.get("/:id", listingController.getListingById);
router3.delete("/:id", verifyToken, listingController.deleteListing);
router3.patch("/:id/view", listingController.incrementListingView);
var listingsRoutes = router3;

// src/modules/listingPromote/listing.promote.route.ts
import { Router as Router4 } from "express";

// src/modules/listingPromote/listing.promote.service.ts
import mongoose2 from "mongoose";

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
    final_commission_pct: {
      type: Number,
      min: 0,
      max: 100
    },
    final_commission_amount: {
      type: Number,
      min: 0
    },
    deal_closed_at: {
      type: Date
    },
    payment_tracking: {
      sent_by: {
        type: Schema6.Types.ObjectId,
        ref: "User"
      },
      sent_at: {
        type: Date
      },
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
var shouldApplyPlatformFee = (paymentMethod) => {
  return paymentMethod === "stripe" || paymentMethod === "helcim";
};

// src/utility/throwServiceError.ts
var throwServiceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var throwServiceError_default = throwServiceError;

// src/utility/assertFound.ts
var assertFound = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError_default(message, statusCode);
  }
};
var assertFound_default = assertFound;

// src/modules/commissionLedger/commission.ledger.service.ts
var getPaginationParams = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
var throwError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var toObjectId = (id3) => {
  if (!Types4.ObjectId.isValid(id3)) {
    throwError("Invalid id", 400);
  }
  return new Types4.ObjectId(id3);
};
var isAdminOrManager = (role) => {
  return role === "founder" || role === "manager";
};
var isSameId = (idA, idB) => {
  return String(idA) === String(idB);
};
var ensureValueExists = (value, message, statusCode) => {
  if (value == null) {
    throwError(message, statusCode);
  }
  return value;
};
var ensureCommissionExists = (commission) => {
  return ensureValueExists(commission, "Commission record not found", 404);
};
var populateCommissionQuery = () => {
  return [
    {
      path: "listing_id",
      select: "title ref_code price referral_commission cover_image"
    },
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
  listing,
  session
}) => {
  const promoter_id = promoteRequest.requester.user_id.toString();
  const listingPriceAmount = listing.price.amount;
  const commissionRatePercent = promoteRequest.proposed_commission_pct ?? listing.referral_commission.offered_amount;
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
      runValidators: true,
      session
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
    throwError("You are not allowed to view this commission record", 403);
  }
  return safeCommission;
};
var createManualCommissionIntoDB = async (authUser, payload) => {
  const listing = await Listing.findById(payload.listing_id).lean();
  const safeListing = ensureValueExists(listing, "Listing not found", 404);
  const isListingOwner = isSameId(safeListing.associate_id, authUser.id);
  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError(
      "Only listing owner, admin, or manager can create commission",
      403
    );
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
    platform_fee: {
      rate_percent: 4.5,
      amount: 0,
      status: "pending"
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
    throwError("This commission is frozen due to a dispute", 400);
  }
  const isListingOwner = isSameId(safeCommission.listing_owner_id, authUser.id);
  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError(
      "Only listing owner, admin, or manager can confirm commission",
      403
    );
  }
  if (safeCommission.status !== "pending") {
    throwError("Only pending commission can be confirmed", 400);
  }
  const grossCommissionAmount = calculateCommissionAmount(
    safeCommission.listing_price_amount,
    payload.final_commission_pct
  );
  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "confirmed",
        final_commission_pct: payload.final_commission_pct,
        final_commission_amount: grossCommissionAmount,
        deal_closed_at: payload.deal_closed_at ? new Date(payload.deal_closed_at) : /* @__PURE__ */ new Date(),
        platform_fee: {
          rate_percent: 4.5,
          amount: 0,
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
    throwError("This commission is frozen due to a dispute", 400);
  }
  if (!isAdminOrManager(authUser.role)) {
    throwError("Only admin or manager can mark commission as paid", 403);
  }
  if (safeCommission.status !== "confirmed") {
    throwError("Only confirmed commission can be marked as paid", 400);
  }
  if (!safeCommission.payment_tracking?.sent_at) {
    throwError("Payment has not been sent by listing owner yet", 400);
  }
  if (!safeCommission.payment_tracking?.receiver_confirmed_at) {
    throwError("Promoter has not confirmed receipt yet", 400);
  }
  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "paid",
        "payment_tracking.marked_paid_by": toObjectId(authUser.id),
        "payment_tracking.marked_paid_at": /* @__PURE__ */ new Date(),
        // ...(payload.payment_method && {
        //   "payment_tracking.payment_method": payload.payment_method,
        // }),
        ...payload.payment_reference && {
          "payment_tracking.payment_reference": payload.payment_reference
        },
        ...payload.note && { "payment_tracking.note": payload.note }
      },
      $push: {
        status_history: {
          status: "paid",
          changed_by: toObjectId(authUser.id),
          changed_at: /* @__PURE__ */ new Date(),
          note: payload.note || "Commission marked as paid by admin."
        }
      }
    },
    { returnDocument: "after", runValidators: true }
  );
  const safeUpdatedCommission = ensureCommissionExists(updatedCommission);
  await Listing.findByIdAndUpdate(safeUpdatedCommission.listing_id, {
    $set: {
      status: "sold",
      sold_at: /* @__PURE__ */ new Date()
    }
  });
  return safeUpdatedCommission;
};
var confirmCommissionReceivedIntoDB = async (commissionId, authUser, payload) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);
  if (!isSameId(safeCommission.promoter_id, authUser.id)) {
    throwError("Only the receiving promoter can confirm payment received", 403);
  }
  if (!safeCommission.payment_tracking?.sent_at) {
    throwError("Payment has not been sent yet", 400);
  }
  if (safeCommission.payment_tracking?.receiver_confirmed_at) {
    throwError("Payment already confirmed as received", 400);
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
          status: safeCommission.status,
          // still 'confirmed'
          changed_by: toObjectId(authUser.id),
          changed_at: /* @__PURE__ */ new Date(),
          note: payload.note || "Receiver confirmed payment received."
        }
      }
    },
    { returnDocument: "after", runValidators: true }
  );
  return ensureCommissionExists(updatedCommission);
};
var disputeCommissionIntoDB = async (commissionId, authUser, payload) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);
  const isInvolved = isSameId(safeCommission.listing_owner_id, authUser.id) || isSameId(safeCommission.promoter_id, authUser.id);
  if (!isAdminOrManager(authUser.role) && !isInvolved) {
    throwError("You are not allowed to dispute this commission", 403);
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
    throwError("Only admin or manager can resolve dispute", 403);
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
var sendCommissionPaymentIntoDB = async (id3, authUser, payload) => {
  const commission = await CommissionLedger.findById(id3);
  if (!commission) {
    throwError("Commission not found", 404);
  }
  assertFound_default(commission, "Commission not found", 404);
  if (commission.listing_owner_id.toString() !== authUser.id) {
    throwError("Only listing owner can send payment", 403);
  }
  if (commission.status !== "confirmed") {
    throwError("Only confirmed commission can be sent for payment", 400);
  }
  if (commission.payment_tracking?.sent_at) {
    throwError("Payment already sent", 400);
  }
  if (!payload.payment_method) {
    throwError("Payment method is required", 400);
  }
  const grossCommissionAmount = Number(commission.final_commission_amount);
  if (!Number.isFinite(grossCommissionAmount) || grossCommissionAmount <= 0) {
    throwError("Final commission amount is invalid", 400);
  }
  const hasPlatformFee = shouldApplyPlatformFee(payload.payment_method);
  const platformFeeAmount = hasPlatformFee ? calculatePlatformFeeAmount(grossCommissionAmount, 4.5) : 0;
  const netFinalCommissionAmount = Number(
    (grossCommissionAmount - platformFeeAmount).toFixed(2)
  );
  commission.final_commission_amount = netFinalCommissionAmount;
  commission.platform_fee = {
    rate_percent: hasPlatformFee ? 4.5 : 0,
    amount: platformFeeAmount,
    status: hasPlatformFee ? "pending" : "not_required"
  };
  commission.payment_tracking = {
    ...commission.payment_tracking,
    sent_by: new Types4.ObjectId(authUser.id),
    sent_at: /* @__PURE__ */ new Date(),
    payment_method: payload.payment_method,
    ...payload.payment_reference && {
      payment_reference: payload.payment_reference
    },
    ...payload.note && {
      note: payload.note
    }
  };
  commission.status_history.push({
    status: commission.status,
    changed_by: new Types4.ObjectId(authUser.id),
    changed_at: /* @__PURE__ */ new Date(),
    note: payload.note || `Listing owner sent commission payment via ${payload.payment_method}.`
  });
  await commission.save();
  return commission;
};
var getMyFinalCommissionTotalFromDB = async (authUser) => {
  const result = await CommissionLedger.aggregate([
    {
      $match: {
        promoter_id: toObjectId(
          authUser.id
        ),
        status: {
          $in: [
            "confirmed",
            "paid"
          ]
        },
        final_commission_amount: {
          $exists: true,
          $ne: null
        },
        // Payment method already selected,
        // so final amount is really final
        "payment_tracking.sent_at": {
          $exists: true
        }
      }
    },
    {
      $group: {
        _id: null,
        total_final_commission: {
          $sum: "$final_commission_amount"
        },
        total_commissions: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_final_commission: 1,
        total_commissions: 1
      }
    }
  ]);
  return result[0] ?? {
    total_final_commission: 0,
    total_commissions: 0
  };
};
var getAllFinalCommissionTotalFromDB = async () => {
  const result = await CommissionLedger.aggregate([
    {
      $match: {
        status: {
          $in: [
            "confirmed",
            "paid"
          ]
        },
        final_commission_amount: {
          $exists: true,
          $ne: null
        },
        "payment_tracking.sent_at": {
          $exists: true
        }
      }
    },
    {
      $group: {
        _id: null,
        total_final_commission: {
          $sum: "$final_commission_amount"
        },
        total_commissions: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_final_commission: 1,
        total_commissions: 1
      }
    }
  ]);
  return result[0] ?? {
    total_final_commission: 0,
    total_commissions: 0
  };
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
  resolveCommissionDisputeIntoDB,
  sendCommissionPaymentIntoDB,
  getMyFinalCommissionTotalFromDB,
  getAllFinalCommissionTotalFromDB
};

// src/modules/listingPromote/listing.promotion.approval.email.ts
import nodemailer2 from "nodemailer";
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
var getPromotionApprovalEmailHtml = (promoterName, listingTitle, listingId, tier, confirmedCommissionPct, accessUrl, promoterWebsiteUrl, marketingDocumentUrl) => {
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
        <div style="margin-top:24px;text-align:center;">
  <a
    href="${escapeHtml2(accessUrl)}"
    style="
      display:inline-block;
      background:${tierColor};
      color:#ffffff;
      text-decoration:none;
      padding:12px 22px;
      border-radius:8px;
      font-weight:700;
    "
  >
    View Promotion Details
  </a>
</div>

${promoterWebsiteUrl ? `
      <p style="margin-top:20px;">
        <strong>Promoter Website:</strong><br>
        <a href="${escapeHtml2(promoterWebsiteUrl)}">
          ${escapeHtml2(promoterWebsiteUrl)}
        </a>
      </p>
    ` : ""}

${marketingDocumentUrl ? `
      <p>
        <strong>Marketing Document:</strong><br>
        <a href="${escapeHtml2(marketingDocumentUrl)}">
          Open marketing document
        </a>
      </p>
    ` : ""}

        <p style="margin-top:20px;">
          Please ensure all promotion activities remain within the permissions
          granted by your tier.
        </p>

        <p>
          Regards,<br>
          <strong>World Elite Team</strong>
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
  confirmedCommissionPct,
  accessUrl,
  promoterWebsiteUrl,
  marketingDocumentUrl
}) => {
  const transporter = nodemailer2.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config_default.SMTP_AUTH_USER,
      pass: config_default.SMTP_AUTH_PASS
    }
  });
  await transporter.sendMail({
    from: `"World Elite Team" <${config_default.SMTP_AUTH_USER}>`,
    to: toEmail,
    subject: `Congratulations! You are approved to promote ${listingTitle}`,
    text: `
Hello ${promoterName},

You have accepted the listing owner's terms and your promotion is now active.

Listing: ${listingTitle}
Tier: ${tier.replace("_", " ").toUpperCase()}
Commission: ${confirmedCommissionPct}%
Access link: ${accessUrl}
    `.trim(),
    html: getPromotionApprovalEmailHtml(
      promoterName,
      listingTitle,
      listingId,
      tier,
      confirmedCommissionPct,
      accessUrl,
      promoterWebsiteUrl,
      marketingDocumentUrl
    )
  });
};

// src/modules/promoters/promoters.model.schema.ts
import { Schema as Schema7, model as model7 } from "mongoose";
var promotedListingSchema = new Schema7(
  {
    listing_id: {
      type: Schema7.Types.ObjectId,
      ref: "Listing",
      required: true
    },
    listing_title: {
      type: String,
      ref: "Listing",
      required: true
    },
    listing_price: {
      type: Number,
      ref: "Listing",
      required: true
    },
    listing_owner_id: {
      type: Schema7.Types.ObjectId,
      ref: "User",
      required: true
    },
    promotion_request_id: {
      type: Schema7.Types.ObjectId,
      ref: "PromoteRequest",
      required: true
    },
    tier: {
      type: String,
      enum: ["tier_1", "tier_2", "tier_3"],
      required: true
    },
    approved_by: {
      type: Schema7.Types.ObjectId,
      ref: "User",
      required: true
    },
    approved_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    _id: false
  }
);
var promoterSchema = new Schema7(
  {
    user: {
      type: Schema7.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    user_id: {
      type: Schema7.Types.ObjectId,
      ref: "User"
    },
    listings: {
      type: [promotedListingSchema],
      default: []
    },
    profile_views: {
      type: Number,
      default: 10
    }
  },
  {
    timestamps: true
  }
);
var Promoter = model7("Promoter", promoterSchema);

// src/modules/listingPromote/listing.promote.service.ts
var isAdminOrManager2 = (role) => {
  return role === "admin" || role === "manager";
};
var createPromoteRequestInDB = async (requesterId, payload) => {
  if (!payload.listing_id || !requesterId) {
    throw new Error("listing_id and requester_id are required");
  }
  const listing = await Listing.findById(payload.listing_id);
  if (!listing) {
    throw new Error("Listing not found");
  }
  if (listing.associate_id.toString() === requesterId.toString()) {
    throw new Error("You cannot request to promote your own listing");
  }
  const existingRequest = await PromoteRequest.findOne({
    listing_id: payload.listing_id,
    "requester.user_id": requesterId,
    status: {
      $in: ["pending", "owner_approved", "approved", "promoter_rejected"]
    }
  });
  if (existingRequest) {
    const statusMessages = {
      pending: "You already have a pending promote request for this listing",
      owner_approved: "The listing owner has approved your request. Please accept or reject the terms.",
      approved: "You are already an approved promoter for this listing",
      promoter_rejected: "You previously rejected the listing owner's terms. You cannot submit another promotion request for this listing."
    };
    throw new BadRequestError(
      statusMessages[existingRequest.status] ?? "You already have an active request for this listing"
    );
  }
  const promoteRequest = new PromoteRequest({
    listing_id: payload.listing_id,
    requester: {
      user_id: requesterId,
      email: payload.requester?.email ?? ""
    },
    proposed_commission_pct: payload.proposed_commission_pct ?? 0,
    marketing_channels: payload.marketing_channels ?? [],
    message: payload.message ?? "",
    status: "pending",
    promoter_agreement_status: "not_started",
    selected_tier: null
  });
  return await promoteRequest.save();
};
var getAllListingPromoteRequest = async (query) => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query
  };
  const promoteRequestQuery = new queryBuilder_default(
    PromoteRequest.find().populate(
      "listing_id",
      "title ref_code cover_image price referral_commission"
    ).populate(
      "requester.user_id",
      "fullName email profileImage licenseNumber phone country city role bio"
    ),
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
      "title ref_code cover_image price referral_commission location.city location.region location.country"
    ).populate(
      "requester.user_id",
      "fullName email profileImage licenseNumber phone country city role bio"
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
    }).populate(
      "listing_id",
      "title ref_code cover_image price referral_commission"
    ).populate(
      "requester.user_id",
      "fullName email profileImage licenseNumber phone country city role bio"
    ),
    queryWithDefaultSort
  ).search(["message"]).filter().sort().paginate().fieldsLimit();
  const documents = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
  const data = documents.map((document) => {
    const item = typeof document.toObject === "function" ? document.toObject() : document;
    const requesterUserId = item.requester?.user_id?._id ?? item.requester?.user_id;
    const isOriginalRequester = String(requesterUserId) === String(requesterId);
    const awaitingDecision = item.status === "owner_approved" && item.promoter_agreement_status === "pending";
    return {
      ...item,
      workflow: {
        waiting_for_owner: item.status === "pending",
        waiting_for_promoter_decision: awaitingDecision,
        can_accept_owner_terms: awaitingDecision && isOriginalRequester,
        can_reject_owner_terms: awaitingDecision && isOriginalRequester,
        promoter_accepted: item.status === "approved" && item.promoter_agreement_status === "accepted",
        promoter_rejected: item.status === "promoter_rejected" && item.promoter_agreement_status === "rejected",
        permanently_blocked_from_requesting_again: item.status === "promoter_rejected"
      }
    };
  });
  return {
    data,
    meta
  };
};
var deletePromoteRequest = async (id3, role) => {
  if (role !== "admin") {
    throw new UnauthorizedError("Only admins can perform this action");
  }
  const promoteRequest = await PromoteRequest.findById(id3);
  if (!promoteRequest) {
    throw new NotFoundError("Promote request not found");
  }
  promoteRequest.is_deleted = true;
  promoteRequest.deleted_at = /* @__PURE__ */ new Date();
  return await promoteRequest.save();
};
var managePromoteRequestInDB = async (promoteRequestId, authUser, payload) => {
  const session = await mongoose2.startSession();
  try {
    session.startTransaction();
    const promoteRequest = await PromoteRequest.findById(promoteRequestId).session(session);
    if (!promoteRequest) {
      throw new NotFoundError("Promote request not found");
    }
    const listing = await Listing.findById(promoteRequest.listing_id).session(
      session
    );
    if (!listing) {
      throw new NotFoundError("Related listing not found");
    }
    if (promoteRequest.status !== "pending") {
      throw new BadRequestError("Only pending promote requests can be managed");
    }
    const isOwner = String(listing.associate_id) === String(authUser.id);
    const isAdmin = isAdminOrManager2(authUser.role);
    if (!isOwner && !isAdmin) {
      throw new UnauthorizedError(
        "You are not authorized to manage this promote request"
      );
    }
    if (payload.status === "approved") {
      if (!payload.selected_tier) {
        throw new BadRequestError(
          "selected_tier is required when approving a request"
        );
      }
      promoteRequest.status = "owner_approved";
      promoteRequest.selected_tier = payload.selected_tier;
      promoteRequest.promoter_agreement_status = "pending";
      promoteRequest.owner_approved_at = /* @__PURE__ */ new Date();
      promoteRequest.resolved_at = void 0;
    }
    if (payload.status === "rejected") {
      promoteRequest.status = "rejected";
      promoteRequest.promoter_agreement_status = "not_started";
      promoteRequest.resolved_at = /* @__PURE__ */ new Date();
    }
    await promoteRequest.save({ session });
    await session.commitTransaction();
    return promoteRequest;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
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
var getPublicPromoteRequestDetailsFromDB = async (id3) => {
  const promoteRequest = await PromoteRequest.findById(id3).populate({
    path: "listing_id",
    select: "title ref_code cover_image images price location bedrooms bathrooms area_sqm referral_commission status",
    populate: {
      path: "associate_id",
      select: "fullName email phone licenseNumber brokerage profileImage city country bio socialLinks role"
    }
  }).populate({
    path: "requester.user_id",
    select: "fullName email phone licenseNumber brokerage profileImage city country bio socialLinks role"
  }).lean();
  if (!promoteRequest) {
    throw new NotFoundError("This link is invalid or no longer exists");
  }
  const safeRequest = promoteRequest;
  if (safeRequest.status !== "approved") {
    throw new BadRequestError(
      "This promotion request has not been approved yet"
    );
  }
  if (!safeRequest.selected_tier) {
    throw new BadRequestError("This request has no tier assigned yet");
  }
  const listing = safeRequest.listing_id;
  const owner = listing?.associate_id;
  const promoter = safeRequest.requester?.user_id;
  return {
    id: safeRequest._id,
    status: safeRequest.status,
    selected_tier: safeRequest.selected_tier,
    requested_at: safeRequest.requested_at,
    resolved_at: safeRequest.resolved_at,
    proposed_commission_pct: safeRequest.proposed_commission_pct,
    confirmed_commission_pct: safeRequest.confirmed_commission_pct,
    listing: listing ? {
      id: listing._id,
      title: listing.title,
      ref_code: listing.ref_code,
      status: listing.status,
      cover_image: listing.cover_image,
      images: listing.images,
      price: listing.price,
      location: listing.location,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area_sqm: listing.area_sqm,
      referral_commission: listing.referral_commission
    } : null,
    listing_owner: owner ? {
      fullName: owner.fullName,
      email: owner.email,
      phone: owner.phone,
      licenseNumber: owner.licenseNumber,
      brokerage: owner.brokerage,
      profileImage: owner.profileImage,
      city: owner.city,
      country: owner.country,
      bio: owner.bio,
      socialLinks: owner.socialLinks,
      role: owner.role
    } : null,
    promoter: promoter ? {
      fullName: promoter.fullName,
      email: promoter.email,
      phone: promoter.phone,
      licenseNumber: promoter.licenseNumber,
      brokerage: promoter.brokerage,
      profileImage: promoter.profileImage,
      city: promoter.city,
      country: promoter.country,
      bio: promoter.bio,
      socialLinks: promoter.socialLinks,
      role: promoter.role
    } : { email: safeRequest.requester?.email }
  };
};
var respondToOwnerTermsInDB = async (promoteRequestId, requesterId, payload) => {
  if (!payload.decision || !["accepted", "rejected"].includes(payload.decision)) {
    throw new BadRequestError(
      "decision must be either 'accepted' or 'rejected'"
    );
  }
  const session = await mongoose2.startSession();
  let completedRequest = null;
  let emailPayload = null;
  try {
    session.startTransaction();
    const promoteRequest = await PromoteRequest.findOne({
      _id: promoteRequestId,
      is_deleted: { $ne: true }
    }).session(session);
    if (!promoteRequest) {
      throw new NotFoundError("Promote request not found");
    }
    if (String(promoteRequest.requester.user_id) !== String(requesterId)) {
      throw new UnauthorizedError(
        "Only the promoter who submitted this request can respond to the owner's terms"
      );
    }
    if (promoteRequest.status !== "owner_approved") {
      throw new BadRequestError(
        "This request is not awaiting promoter confirmation"
      );
    }
    if (promoteRequest.promoter_agreement_status !== "pending") {
      throw new BadRequestError("You have already responded to these terms");
    }
    if (payload.decision === "rejected") {
      const rejectionReason = payload.rejection_reason?.trim();
      promoteRequest.status = "promoter_rejected";
      promoteRequest.promoter_agreement_status = "rejected";
      promoteRequest.promoter_rejected_at = /* @__PURE__ */ new Date();
      promoteRequest.resolved_at = /* @__PURE__ */ new Date();
      if (rejectionReason) {
        promoteRequest.promoter_rejection_reason = rejectionReason;
      } else {
        promoteRequest.set("promoter_rejection_reason", void 0);
      }
      promoteRequest.set("promoter_website_url", void 0);
      promoteRequest.set("marketing_document_url", void 0);
      promoteRequest.set("access_url", void 0);
      await promoteRequest.save({ session });
      await session.commitTransaction();
      return promoteRequest;
    }
    if (!promoteRequest.selected_tier) {
      throw new BadRequestError(
        "No promotion tier has been assigned to this request"
      );
    }
    const listing = await Listing.findById(promoteRequest.listing_id).session(
      session
    );
    if (!listing) {
      throw new NotFoundError("Related listing not found");
    }
    const promoterUser = await User.findById(promoteRequest.requester.user_id).select("fullName email").session(session);
    const promoterWebsiteUrl = payload.promoter_website_url?.trim() || void 0;
    const marketingDocumentUrl = payload.marketing_document_url?.trim() || void 0;
    if (promoterWebsiteUrl) {
      try {
        new URL(promoterWebsiteUrl);
      } catch {
        throw new BadRequestError("promoter_website_url must be a valid URL");
      }
    }
    if (marketingDocumentUrl) {
      try {
        new URL(marketingDocumentUrl);
      } catch {
        throw new BadRequestError("marketing_document_url must be a valid URL");
      }
    }
    const frontendUrl = String(config_default.FRONTEND_URL ?? "").trim().replace(/\/+$/, "");
    if (!frontendUrl) {
      throw new BadRequestError("FRONTEND_URL is not configured");
    }
    const accessUrl = `${frontendUrl}/promote-request/public/` + promoteRequest._id.toString();
    promoteRequest.status = "approved";
    promoteRequest.promoter_agreement_status = "accepted";
    promoteRequest.promoter_accepted_at = /* @__PURE__ */ new Date();
    promoteRequest.resolved_at = /* @__PURE__ */ new Date();
    promoteRequest.set("promoter_rejection_reason", void 0);
    promoteRequest.set("promoter_rejected_at", void 0);
    if (promoterWebsiteUrl) {
      promoteRequest.promoter_website_url = promoterWebsiteUrl;
    } else {
      promoteRequest.set("promoter_website_url", void 0);
    }
    if (marketingDocumentUrl) {
      promoteRequest.marketing_document_url = marketingDocumentUrl;
    } else {
      promoteRequest.set("marketing_document_url", void 0);
    }
    promoteRequest.access_url = accessUrl;
    await promoteRequest.save({ session });
    await Listing.findByIdAndUpdate(
      listing._id,
      {
        $addToSet: {
          promoters: {
            user_id: promoteRequest.requester.user_id,
            tier: promoteRequest.selected_tier
          }
        }
      },
      {
        session,
        runValidators: true
      }
    );
    const alreadyAddedToPromoter = await Promoter.exists({
      user_id: promoteRequest.requester.user_id,
      "listings.promotion_request_id": promoteRequest._id
    }).session(session);
    if (!alreadyAddedToPromoter) {
      await Promoter.findOneAndUpdate(
        {
          user_id: promoteRequest.requester.user_id
        },
        {
          $setOnInsert: {
            user_id: promoteRequest.requester.user_id,
            user: promoteRequest.requester.user_id
          },
          $push: {
            listings: {
              listing_id: listing._id,
              listing_title: listing.title,
              listing_price: listing.price?.amount ?? 0,
              listing_owner_id: listing.associate_id,
              promotion_request_id: promoteRequest._id,
              tier: promoteRequest.selected_tier,
              approved_by: listing.associate_id,
              approved_at: promoteRequest.owner_approved_at ?? /* @__PURE__ */ new Date(),
              promoter_accepted_at: /* @__PURE__ */ new Date(),
              promoter_website_url: promoterWebsiteUrl,
              marketing_document_url: marketingDocumentUrl,
              access_url: accessUrl,
              status: "active"
            }
          }
        },
        {
          upsert: true,
          new: true,
          session,
          runValidators: true
        }
      );
    }
    await commissionLedgerService.createPendingCommissionFromPromotionApproval({
      listing_id: listing._id.toString(),
      promotion_request_id: promoteRequest._id.toString(),
      approved_by: listing.associate_id.toString(),
      promoteRequest,
      listing,
      session
    });
    emailPayload = {
      toEmail: promoterUser?.email ?? promoteRequest.requester.email,
      promoterName: promoterUser?.fullName ?? "Promoter",
      listingTitle: listing.title,
      listingId: listing._id.toString(),
      tier: promoteRequest.selected_tier,
      confirmedCommissionPct: promoteRequest.confirmed_commission_pct ?? 0,
      accessUrl,
      ...promoterWebsiteUrl ? { promoterWebsiteUrl } : {},
      ...marketingDocumentUrl ? { marketingDocumentUrl } : {}
    };
    completedRequest = promoteRequest;
    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
  if (emailPayload) {
    try {
      await sendPromotionApprovalEmail(emailPayload);
    } catch (error) {
      console.error("Promotion approval email failed:", error);
    }
  }
  if (!completedRequest) {
    throw new Error("Unable to complete promoter decision");
  }
  return completedRequest;
};
var listingPromoteRequestService = {
  createPromoteRequestInDB,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequestFromDB,
  managePromoteRequestInDB,
  getMyPromoteRequestsFromDB,
  cancelPromoteRequestInDB,
  deletePromoteRequest,
  getPublicPromoteRequestDetailsFromDB,
  // acceptOwnerTermsInDB,
  respondToOwnerTermsInDB
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
    const result = await listingPromoteRequestService.createPromoteRequestInDB(
      requesterId,
      updatedPayload
    );
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
    const result = await listingPromoteRequestService.getMyListingsPromoteRequestFromDB(
      associate_id,
      query
    );
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
    const result = await listingPromoteRequestService.getMyPromoteRequestsFromDB(
      requesterId,
      query
    );
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
    const { id: id3 } = req.params;
    const requesterId = req.user?.id;
    const result = await listingPromoteRequestService.cancelPromoteRequestInDB(
      id3,
      requesterId
    );
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
    const { id: id3 } = req.params;
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
    const result = await listingPromoteRequestService.managePromoteRequestInDB(
      id3,
      {
        id: userId,
        role
      },
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
    const { id: id3 } = req.params;
    const role = req.user?.role;
    const result = await listingPromoteRequestService.deletePromoteRequest(
      id3,
      role
    );
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
var getPublicPromoteRequestDetails = async (req, res, next) => {
  try {
    const { id: id3 } = req.params;
    const result = await listingPromoteRequestService.getPublicPromoteRequestDetailsFromDB(
      id3
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Promote request details retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var respondToOwnerTerms = async (req, res, next) => {
  try {
    const { id: id3 } = req.params;
    const requesterId = typeof req.user?.id === "string" ? req.user.id : void 0;
    if (!requesterId) {
      throw new UnauthorizedError(
        "You must be logged in to respond to the terms"
      );
    }
    const promoteRequestId = Array.isArray(id3) ? id3[0] : id3;
    if (!promoteRequestId) {
      throw new UnauthorizedError("Promote request id is required");
    }
    const result = await listingPromoteRequestService.respondToOwnerTermsInDB(
      promoteRequestId,
      requesterId,
      req.body
    );
    const message = req.body.decision === "accepted" ? "Owner terms accepted and promotion activated successfully" : "Owner terms rejected successfully. You cannot request this listing again.";
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message,
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
  deletePromoteRequest: deletePromoteRequest2,
  getPublicPromoteRequestDetails,
  // acceptOwnerTerms,
  respondToOwnerTerms
};

// src/modules/listingPromote/listing.promote.route.ts
var router4 = Router4();
router4.get("/all", verifyToken, listingPromoteRequestController.getAllListingPromoteRequest);
router4.post("/", verifyToken, listingPromoteRequestController.createListingPromoteRequest);
router4.post("/manage/:id", verifyToken, listingPromoteRequestController.manageListingPromoteRequest);
router4.get("/received", verifyToken, listingPromoteRequestController.getMyListingsPromoteRequest);
router4.get("/sent", verifyToken, listingPromoteRequestController.getMyPromoteRequests);
router4.delete("/:id", verifyToken, listingPromoteRequestController.deletePromoteRequest);
router4.put("/:id", verifyToken, listingPromoteRequestController.cencelPromoteRequest);
router4.get(
  "/public/:id",
  listingPromoteRequestController.getPublicPromoteRequestDetails
);
router4.patch(
  "/:id/accept-owner-terms",
  verifyToken,
  listingPromoteRequestController.respondToOwnerTerms
);
var listingPromoteRequestRoutes = router4;

// src/modules/commissionLedger/commission.ledger.route.ts
import { Router as Router5 } from "express";

// src/modules/commissionLedger/commission.ledger.validation.ts
import { z as z3 } from "zod";
import { Types as Types7 } from "mongoose";
var mongoIdValidation = z3.string().refine((id3) => Types7.ObjectId.isValid(id3), {
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
    // final_commission_amount: z.number().min(0),
    final_commission_pct: z3.number().min(0).max(100),
    deal_closed_at: z3.string().datetime().optional(),
    note: z3.string().trim().max(1e3).optional()
  })
});
var markCommissionPaidValidation = z3.object({
  params: z3.object({
    id: mongoIdValidation
  }),
  body: z3.object({
    payment_method: z3.enum(COMMISSION_PAYMENT_METHODS).optional(),
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
var sendCommissionPaymentValidation = z3.object({
  params: z3.object({
    id: z3.string().min(1)
  }),
  body: z3.object({
    payment_method: z3.enum([
      "bank_transfer",
      "stripe",
      "helcim",
      "cash",
      "check",
      "other"
    ]),
    payment_reference: z3.string().optional(),
    note: z3.string().optional()
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
var sendCommissionPayment = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const validatedData = sendCommissionPaymentValidation.parse({
      params: req.params,
      body: req.body
    });
    const result = await commissionLedgerService.sendCommissionPaymentIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Commission payment sent successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyFinalCommissionTotal = async (req, res, next) => {
  try {
    const authUser = getAuthUser(req);
    const result = await commissionLedgerService.getMyFinalCommissionTotalFromDB(authUser);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "My final commission total retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllFinalCommissionTotal = async (req, res, next) => {
  try {
    const result = await commissionLedgerService.getAllFinalCommissionTotalFromDB();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All users final commission total retrieved successfully",
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
  resolveCommissionDispute,
  sendCommissionPayment,
  getMyFinalCommissionTotal,
  getAllFinalCommissionTotal
};

// src/modules/commissionLedger/commission.ledger.route.ts
var router5 = Router5();
router5.use(verifyToken);
router5.get(
  "/admin/all",
  authorizeRoles("founder", "manager"),
  commissionLedgerController.getAllCommissions
);
router5.patch(
  "/admin/:id/resolve-dispute",
  authorizeRoles("founder", "manager"),
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
router5.patch(
  "/:id/mark-paid",
  verifyToken,
  authorizeRoles("founder", "manager"),
  commissionLedgerController.markCommissionPaid
);
router5.patch(
  "/:id/confirm-received",
  commissionLedgerController.confirmCommissionReceived
);
router5.patch("/:id/dispute", commissionLedgerController.disputeCommission);
router5.patch(
  "/:id/send-payment",
  commissionLedgerController.sendCommissionPayment
);
router5.patch(
  "/:id/confirm-received",
  commissionLedgerController.confirmCommissionReceived
);
router5.get("/my/total", commissionLedgerController.getMyFinalCommissionTotal);
router5.get(
  "/admin/total",
  authorizeRoles("founder", "manager"),
  commissionLedgerController.getAllFinalCommissionTotal
);
var commissionLedgerRoutes = router5;

// src/modules/admin/admin.route.ts
import { Router as Router6 } from "express";

// src/modules/admin/admin.service.ts
import { Types as Types9 } from "mongoose";

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
    family: 4,
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

// src/utility/sendAccountApprovedMail.ts
var WEBSITE_URL = "https://we-command-center.vercel.app/";
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
    text: `Hello ${fullName},

Your World Elite account has been approved successfully.

Role: ${role}
Access: ${accessLabel}

You can now log in to your account and access your approved dashboard.

Go to the website:
${WEBSITE_URL}

Thank you,
World Elite Team`,
    html: `
      <div
        style="
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            padding: 32px 24px;
          "
        >
          <div
            style="
              background-color: #ffffff;
              padding: 32px;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            "
          >
            <h2
              style="
                margin: 0 0 24px;
                font-size: 24px;
                color: #111827;
                text-align: center;
              "
            >
              Your Account Has Been Approved
            </h2>

            <p
              style="
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
              "
            >
              Hello ${fullName},
            </p>

            <p
              style="
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
              "
            >
              Your World Elite account has been approved successfully.
            </p>

            <div
              style="
                margin: 22px 0;
                padding: 18px;
                background-color: #f3f4f6;
                border-radius: 10px;
              "
            >
              <p
                style="
                  margin: 0 0 8px;
                  color: #111827;
                "
              >
                <strong>Role:</strong> ${role}
              </p>

              <p
                style="
                  margin: 0;
                  color: #111827;
                "
              >
                <strong>Access:</strong> ${accessLabel}
              </p>
            </div>

            <p
              style="
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
              "
            >
              You can now log in to your account and access your approved dashboard.
            </p>

            <div
              style="
                text-align: center;
                margin: 28px 0;
              "
            >
              <a
                href="${WEBSITE_URL}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  background-color: #111827;
                  color: #ffffff;
                  padding: 12px 28px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-size: 15px;
                  font-weight: 600;
                "
              >
                Go to Website
              </a>
            </div>

            <p
              style="
                font-size: 13px;
                line-height: 1.6;
                color: #6b7280;
                word-break: break-all;
              "
            >
              Website URL:
              <br />
              <a
                href="${WEBSITE_URL}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  color: #2563eb;
                  text-decoration: underline;
                "
              >
                ${WEBSITE_URL}
              </a>
            </p>

            <p
              style="
                font-size: 14px;
                line-height: 1.6;
                color: #6b7280;
                margin-top: 25px;
              "
            >
              Thank you,
              <br />
              World Elite Team
            </p>
          </div>
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

// src/modules/activitylogs/activitylog.service.ts
import { Types as Types8 } from "mongoose";

// src/modules/activitylogs/activity.model.schema.ts
import { model as model8, Schema as Schema8 } from "mongoose";

// src/modules/activitylogs/activitylog.interface.ts
var ACTIVITY_LOG_ACTIONS = [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "login",
  "status_change",
  "other"
];
var ACTIVITY_LOG_ENTITY_TYPES = [
  "User",
  "ChallengePillar",
  "CourseModule",
  "ModuleVideo",
  "ModuleResource",
  "ModuleAction",
  "QuizQuestion",
  "AcademyProfile",
  "UserEntitlement",
  "ModuleProgress",
  "QuizAttempt",
  "QuizCertificate",
  "MentorshipProfile",
  "MentorBooking",
  "MentorshipReview",
  "RetreatLocation",
  "RetreatBatch",
  "RetreatBooking",
  "CommunityPost",
  "CommunityComment",
  "CommunityLike",
  "Leaderboard",
  "LeaderboardEntry",
  "Notification",
  "NotificationTemplate",
  "PaymentPlan",
  "PaymentSession",
  "EntitlementLog",
  "SessionSchedule",
  "SessionAttendance",
  "SupportTicket",
  "FAQ",
  "TermsAndPolicy",
  "EmailTemplate",
  "SessionSchedule",
  "SessionAttendance",
  "StreakLog",
  "PointsLedger",
  "AdminSettings",
  "Other"
];

// src/modules/activitylogs/activity.model.schema.ts
var SENSITIVE_KEYS = [
  "password",
  "newPassword",
  "oldPassword",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "otp",
  "secret",
  "apiKey"
];
var stripSensitiveKeys = (value) => {
  if (!value) {
    return value;
  }
  const cleaned = {};
  for (const [key, val] of Object.entries(value)) {
    const isSensitive = SENSITIVE_KEYS.some(
      (sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );
    if (!isSensitive) {
      cleaned[key] = val;
    }
  }
  return cleaned;
};
var activityLogSchema = new Schema8(
  {
    actor: {
      type: Schema8.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ACTIVITY_LOG_ACTIONS,
      required: true,
      index: true
    },
    targetEntityType: {
      type: String,
      enum: ACTIVITY_LOG_ENTITY_TYPES,
      required: true,
      index: true
    },
    targetEntityId: {
      type: Schema8.Types.ObjectId,
      index: true
    },
    changeSummary: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    changes: {
      type: Schema8.Types.Mixed
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: "activitylog"
  }
);
activityLogSchema.pre("save", function() {
  if (this.isModified("changes")) {
    this.changes = stripSensitiveKeys(
      this.changes
    );
  }
});
activityLogSchema.index({
  actor: 1,
  createdAt: -1
});
activityLogSchema.index({
  targetEntityType: 1,
  targetEntityId: 1,
  createdAt: -1
});
activityLogSchema.index({
  action: 1,
  createdAt: -1
});
var ActivityLog = model8(
  "ActivityLog",
  activityLogSchema
);

// src/modules/activitylogs/activitylog.service.ts
var throwServiceError2 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound2 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError2(message, statusCode);
  }
};
var assertValidObjectId = (value, fieldName) => {
  if (!Types8.ObjectId.isValid(value)) {
    throwServiceError2(`${fieldName} is invalid`, 400);
  }
};
var ensureActorExists = async (actorId) => {
  assertValidObjectId(actorId, "Actor ID");
  const actor = await User.findById(actorId).select("_id fullName email role");
  assertFound2(actor, "Actor not found", 404);
  return actor;
};
var createActivityLog = async (payload) => {
  await ensureActorExists(payload.actor);
  if (payload.targetEntityId) {
    assertValidObjectId(payload.targetEntityId, "Target entity ID");
  }
  const createData = {
    actor: new Types8.ObjectId(payload.actor),
    action: payload.action,
    targetEntityType: payload.targetEntityType
  };
  if (payload.targetEntityId) {
    createData.targetEntityId = new Types8.ObjectId(payload.targetEntityId);
  }
  if (payload.changeSummary !== void 0) {
    createData.changeSummary = payload.changeSummary;
  }
  if (payload.changes !== void 0) {
    createData.changes = payload.changes;
  }
  if (payload.ipAddress !== void 0) {
    createData.ipAddress = payload.ipAddress;
  }
  if (payload.userAgent !== void 0) {
    createData.userAgent = payload.userAgent;
  }
  const log = await ActivityLog.create(createData);
  const populated = await ActivityLog.findById(log._id).populate(
    "actor",
    "fullName email role"
  );
  assertFound2(populated, "Activity log not found after creation", 500);
  return populated;
};
var getAllActivityLogs = async (options2) => {
  const page = options2.page ?? 1;
  const limit = options2.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (options2.actorId) {
    assertValidObjectId(options2.actorId, "Actor ID");
    filter.actor = new Types8.ObjectId(options2.actorId);
  }
  if (options2.action) {
    filter.action = options2.action;
  }
  if (options2.targetEntityType) {
    filter.targetEntityType = options2.targetEntityType;
  }
  if (options2.targetEntityId) {
    assertValidObjectId(options2.targetEntityId, "Target entity ID");
    filter.targetEntityId = new Types8.ObjectId(options2.targetEntityId);
  }
  const [data, total] = await Promise.all([
    ActivityLog.find(filter).sort({
      createdAt: -1
    }).skip(skip).limit(limit).populate("actor", "fullName email role"),
    ActivityLog.countDocuments(filter)
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getSingleActivityLog = async (logId) => {
  assertValidObjectId(logId, "Activity log ID");
  const log = await ActivityLog.findById(logId).populate(
    "actor",
    "fullName email role"
  );
  assertFound2(log, "Activity log not found", 404);
  return log;
};
var activityLogService = {
  createActivityLog,
  getAllActivityLogs,
  getSingleActivityLog
};

// src/modules/admin/admin.service.ts
var throwError2 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var safeLogActivityEvent = async (params) => {
  if (!params.actorId) {
    return;
  }
  try {
    await activityLogService.createActivityLog({
      actor: params.actorId,
      action: params.action,
      targetEntityType: "User",
      targetEntityId: params.targetEntityId,
      ...params.changeSummary !== void 0 ? { changeSummary: params.changeSummary } : {},
      ...params.changes !== void 0 ? { changes: params.changes } : {}
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
};
var updateUserApprovalStatusIntoDB = async (userId, payload, adminId) => {
  if (!Types9.ObjectId.isValid(userId)) {
    throwError2("Invalid user id", 400);
  }
  if (!Types9.ObjectId.isValid(adminId)) {
    throwError2("Invalid admin id", 400);
  }
  const updateQuery = {
    $set: {
      approvalStatus: payload.approvalStatus
    }
  };
  if (payload.approvalStatus === "approved") {
    const existingUser = await User.findById(userId).select(
      "licenseVerificationStatus accountStatus"
    );
    if (!existingUser) {
      throwError2("User not found", 404);
    }
    const alreadyVerified = existingUser?.licenseVerificationStatus === "verified";
    const alreadyActive = existingUser?.accountStatus === "active";
    if (!(alreadyVerified && alreadyActive)) {
      updateQuery.$set.licenseVerificationStatus = "verified";
      updateQuery.$set.accountStatus = "active";
    }
    updateQuery.$set.approvedBy = new Types9.ObjectId(adminId);
    updateQuery.$set.approvedAt = /* @__PURE__ */ new Date();
    updateQuery.$unset = {
      rejectedReason: ""
    };
  }
  if (payload.approvalStatus === "rejected") {
    const rejectedReason = payload.rejectedReason?.trim();
    if (!rejectedReason) {
      throwError2("Rejected reason is required", 400);
    }
    updateQuery.$set.licenseVerificationStatus = "rejected";
    updateQuery.$set.accountStatus = "rejected";
    updateQuery.$set.rejectedReason = rejectedReason;
    updateQuery.$unset = {
      approvedBy: "",
      approvedAt: ""
    };
  }
  if (payload.approvalStatus === "pending") {
    updateQuery.$set.licenseVerificationStatus = "pending";
    updateQuery.$set.accountStatus = "pending_approval";
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
    throwError2("User not found", 404);
  }
  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));
  await safeLogActivityEvent({
    actorId: adminId,
    action: payload.approvalStatus === "approved" ? "approve" : payload.approvalStatus === "rejected" ? "reject" : "status_change",
    targetEntityId: userId,
    changeSummary: `User approval status changed to "${payload.approvalStatus}"`
  });
  return updatedUser;
};
var updateUserLicenseVerificationStatusIntoDB = async (userId, payload, actorId) => {
  if (!Types9.ObjectId.isValid(userId)) {
    throwError2("Invalid user id", 400);
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
    throwError2("User not found", 404);
  }
  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));
  await safeLogActivityEvent({
    actorId,
    action: "status_change",
    targetEntityId: userId,
    changeSummary: `User license verification status changed to "${payload.licenseVerificationStatus}"`
  });
  return updatedUser;
};
var updateUserAccountStatusIntoDB = async (userId, payload, actorId) => {
  if (!Types9.ObjectId.isValid(userId)) {
    throwError2("Invalid user id", 400);
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
    throwError2("User not found", 404);
  }
  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));
  await safeLogActivityEvent({
    actorId,
    action: "status_change",
    targetEntityId: userId,
    changeSummary: `User account status changed to "${payload.accountStatus}"`
  });
  return updatedUser;
};
var deleteUserIntoDB = async (userId, actorId) => {
  const user = await User.findById(userId);
  if (!user) {
    throwError2("User not found", 404);
  }
  await User.findByIdAndDelete(userId);
  await safeLogActivityEvent({
    actorId,
    action: "delete",
    targetEntityId: userId,
    changeSummary: `User "${user?.email ?? userId}" was deleted`
  });
  return { message: "User deleted successfully" };
};
var adminService = {
  updateUserApprovalStatusIntoDB,
  updateUserLicenseVerificationStatusIntoDB,
  updateUserAccountStatusIntoDB,
  deleteUserIntoDB
};

// src/modules/admin/admin.validation.ts
import { z as z4 } from "zod";
import { Types as Types10 } from "mongoose";
var mongoIdValidation2 = z4.string().refine((id3) => Types10.ObjectId.isValid(id3), {
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
    const actorId = typeof req.user?.id === "string" ? req.user.id : void 0;
    const result = await adminService.updateUserLicenseVerificationStatusIntoDB(
      validatedData.params.id,
      validatedData.body,
      actorId
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
    const actorId = typeof req.user?.id === "string" ? req.user.id : void 0;
    const result = await adminService.updateUserAccountStatusIntoDB(
      validatedData.params.id,
      validatedData.body,
      actorId
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
var userDeleteByFounder = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const actorId = typeof req.user?.id === "string" ? req.user.id : void 0;
    const result = await adminService.deleteUserIntoDB(
      userId,
      actorId
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var adminController = {
  updateUserApprovalStatus,
  updateUserLicenseVerificationStatus,
  updateUserAccountStatus,
  userDeleteByFounder
};

// src/modules/admin/admin.route.ts
var router6 = Router6();
router6.patch(
  "/users/:id/approval-status",
  verifyToken,
  authorizeRoles("founder"),
  adminController.updateUserApprovalStatus
);
router6.patch(
  "/users/:id/license-verification-status",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  adminController.updateUserLicenseVerificationStatus
);
router6.patch(
  "/users/:id/account-status",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  adminController.updateUserAccountStatus
);
router6.delete(
  "/users/:id",
  verifyToken,
  authorizeRoles("founder"),
  adminController.userDeleteByFounder
);
var adminRoutes = router6;

// src/modules/listingAssets/listing.assets.route.ts
import { Router as Router7 } from "express";

// src/modules/listingAssets/listing.assets.service.ts
import { ZipArchive } from "archiver";
import { Types as Types11 } from "mongoose";

// src/modules/listingAssets/listing.assets.model.schema.ts
import { Schema as Schema9, model as model9 } from "mongoose";
var ListingAssetDownloadSchema = new Schema9(
  {
    listing_id: {
      type: Schema9.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true
    },
    downloaded_by: {
      type: Schema9.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    promotion_request_id: {
      type: Schema9.Types.ObjectId,
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
var ListingAssetDownload = model9(
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
    ).text(`Price: ${formatPrice(listing.price.amount, listing.price.currency)}`).text(`Bedrooms: ${listing.bedrooms}`).text(`Bathrooms: ${listing.bathrooms}`).text(`Area: ${listing.area_sqm.value} - ${listing.area_sqm.unit}`).text(`Referral Commission Offered: ${listing.referral_commission.offered_amount}%`);
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
var throwError3 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var toObjectId2 = (id3) => {
  if (!Types11.ObjectId.isValid(id3)) {
    throwError3("Invalid id", 400);
  }
  return new Types11.ObjectId(id3);
};
var isAdminOrManager3 = (role) => {
  return role === "admin" || role === "manager";
};
var isAllowedPromoterRole = (role) => {
  return role === "associate" || role === "partner" || role === "ambassador";
};
var ensureListingExists = (listing) => {
  if (listing == null) {
    throwError3("Listing not found", 404);
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
  const hasDirectAccess = isAdminOrManager3(authUser.role) || isListingOwner;
  if (!hasDirectAccess) {
    if (!isAllowedPromoterRole(authUser.role)) {
      throwError3("You are not allowed to download listing assets", 403);
    }
    const approvedRequest = await PromoteRequest.findOne({
      listing_id: toObjectId2(listingId),
      "requester.user_id": toObjectId2(authUser.id),
      status: "approved"
    }).lean();
    if (!approvedRequest) {
      throwError3(
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
  if (!isAdminOrManager3(authUser.role) && !isListingOwner) {
    throwError3("You are not allowed to view asset download logs", 403);
  }
  return ListingAssetDownload.find({
    listing_id: toObjectId2(listingId)
  }).populate("downloaded_by", "fullName email role").populate("listing_id", "title ref_code").sort({ downloaded_at: -1 });
};
var getAllListingAssetLogsFromDB = async (authUser) => {
  if (!isAdminOrManager3(authUser.role)) {
    throwError3("Only admin or manager can view all asset download logs", 403);
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
import { Types as Types12 } from "mongoose";
var mongoIdValidation3 = z5.string().refine((id3) => Types12.ObjectId.isValid(id3), {
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
router7.use(verifyToken);
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

// src/modules/payment/payment.service.ts
import Stripe2 from "stripe";

// src/modules/payment/payment.model.schema.ts
import { Schema as Schema10, model as model10 } from "mongoose";

// src/modules/payment/payment.interface.ts
var PAYMENT_PURPOSES = ["registration", "upgrade", "invictus_purchase"];
var PAYMENT_SESSION_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired"
];

// src/modules/payment/payment.model.schema.ts
var PaymentSessionSchema = new Schema10(
  {
    user: {
      type: Schema10.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: USER_ROLES
    },
    accessTo: {
      type: String,
      enum: ACCESS_TO_OPTIONS
    },
    purpose: {
      type: String,
      enum: PAYMENT_PURPOSES,
      required: true
    },
    durationMonths: {
      type: Number,
      enum: [3, 6, 12]
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
    },
    paymentPlan: {
      type: Schema10.Types.ObjectId,
      ref: "PaymentPlan",
      index: true
    },
    product: {
      type: Schema10.Types.ObjectId,
      refPath: "productRefModel"
    },
    productRefModel: {
      type: String,
      enum: ["ChallengePillar", "RetreatBatch"]
    },
    entitlementActivatedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);
var PaymentSession = model10(
  "PaymentSession",
  PaymentSessionSchema
);

// src/modules/discount/discount.service.ts
import { Types as Types13 } from "mongoose";

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
import { Schema as Schema11, model as model11 } from "mongoose";
var DiscountCodeSchema = new Schema11(
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
    maxRedemptions: {
      type: Number,
      default: 20,
      min: 1
    },
    expiresAt: {
      type: Date
    },
    createdBy: {
      type: Schema11.Types.ObjectId,
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
var DiscountRedemptionSchema = new Schema11(
  {
    discountCode: {
      type: Schema11.Types.ObjectId,
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
      type: Schema11.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: USER_ROLES,
      // required: true,
      index: true
    },
    accessTo: {
      type: String,
      enum: ACCESS_TO_OPTIONS
      // required: true,
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
var DiscountCode = model11(
  "DiscountCode",
  DiscountCodeSchema
);
var DiscountRedemption = model11(
  "DiscountRedemption",
  DiscountRedemptionSchema
);

// src/modules/discount/discount.service.ts
var throwError4 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var MAX_REDEMPTIONS = 20;
var normalizeCode = (code) => {
  return code.trim().toUpperCase();
};
var createDiscountCodeIntoDB = async (payload, adminId) => {
  const code = normalizeCode(payload.code);
  const existing = await DiscountCode.findOne({ code });
  if (existing) {
    throwError4("Discount code already exists", 409);
  }
  const createPayload = {
    code,
    discountPercent: payload.discountPercent,
    maxRedemptions: 20,
    usedCount: 0,
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
    createPayload.createdBy = new Types13.ObjectId(adminId);
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
  if (!role) {
    return null;
  }
  if (!accessTo) {
    return null;
  }
  const normalizedCode = normalizeCode(code);
  const discountCode = await DiscountCode.findOne({
    code: normalizedCode
  });
  if (!discountCode) {
    throwError4("Invalid discount code", 400);
  }
  assertFound_default(discountCode, "Not found discount code", 400);
  if (discountCode.expiresAt && discountCode.expiresAt < /* @__PURE__ */ new Date()) {
    throwError4("Discount code has expired", 400);
  }
  const allowedRoles = discountCode.allowedRoles ?? [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    throwError4(
      "This discount code is not valid for this role",
      400
    );
  }
  const allowedAccessTo = discountCode.allowedAccessTo ?? [];
  if (allowedAccessTo.length > 0 && !allowedAccessTo.includes(accessTo)) {
    throwError4(
      "This discount code is not valid for this access type",
      400
    );
  }
  const usedCount = discountCode.usedCount ?? 0;
  if (usedCount >= MAX_REDEMPTIONS) {
    if (discountCode.isActive) {
      await DiscountCode.findByIdAndUpdate(
        discountCode._id,
        {
          $set: {
            isActive: false
          }
        }
      );
    }
    throwError4(
      "This discount code has reached its usage limit",
      400
    );
  }
  if (!discountCode.isActive && usedCount < MAX_REDEMPTIONS) {
    await DiscountCode.findByIdAndUpdate(
      discountCode._id,
      {
        $set: {
          isActive: true,
          maxRedemptions: MAX_REDEMPTIONS
        }
      }
    );
  }
  if (userId) {
    const alreadyUsedByUser = await DiscountRedemption.findOne({
      discountCode: discountCode._id,
      user: new Types13.ObjectId(userId)
    });
    if (alreadyUsedByUser) {
      throwError4(
        "You have already used this discount code",
        400
      );
    }
  }
  return {
    discountId: discountCode._id,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    usedCount,
    maxRedemptions: MAX_REDEMPTIONS
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
  const userObjectId = new Types13.ObjectId(userId);
  const existingUserRedemption = await DiscountRedemption.findOne({
    discountCode: discount._id,
    user: userObjectId
  });
  if (existingUserRedemption) {
    return existingUserRedemption;
  }
  console.log("user1;");
  const updatedDiscount = await DiscountCode.findOneAndUpdate(
    {
      _id: discount._id,
      $or: [
        { usedCount: { $lt: MAX_REDEMPTIONS } },
        { usedCount: { $exists: false } }
      ]
    },
    {
      $inc: {
        usedCount: 1
      },
      $set: {
        maxRedemptions: MAX_REDEMPTIONS
      }
    },
    {
      new: true
    }
  );
  if (!updatedDiscount) {
    await DiscountCode.findByIdAndUpdate(
      discount._id,
      {
        $set: {
          isActive: false
        }
      }
    );
    return null;
  }
  let redemption;
  try {
    redemption = await DiscountRedemption.create({
      discountCode: discount._id,
      code: discount.code,
      user: userObjectId,
      role,
      accessTo,
      stripeCheckoutSessionId,
      redeemedAt: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    await DiscountCode.findByIdAndUpdate(
      discount._id,
      {
        $inc: {
          usedCount: -1
        }
      }
    );
    console.log("user3;");
    if (error?.code === 11e3) {
      const existing = await DiscountRedemption.findOne({
        discountCode: discount._id,
        user: userObjectId
      });
      console.log("user4");
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
  const isNowExhausted = (updatedDiscount.usedCount ?? 0) >= MAX_REDEMPTIONS;
  await DiscountCode.findByIdAndUpdate(discount._id, {
    $set: {
      isActive: !isNowExhausted
    }
  }).catch((err) => {
    console.error(
      "Failed to update isActive after successful redemption:",
      err
    );
  });
  return redemption;
};
var sendDiscountCodeByEmail = async (email, code) => {
  const discount = await DiscountCode.findOne({
    code: normalizeCode(code),
    isActive: true
  });
  if (!discount) {
    throwError4("Discount code not found or inactive", 404);
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
var deleteDiscountCodeFromDB = async (id3) => {
  const discount = await DiscountCode.findById(id3);
  if (!discount) {
    throwError4("Discount code not found", 404);
  }
  await DiscountCode.findByIdAndDelete(id3);
  return { deleted: true };
};
var discountService = {
  createDiscountCodeIntoDB,
  getAllDiscountCodesFromDB,
  validateDiscountCodeForCheckout,
  redeemDiscountCodeAfterPayment,
  sendDiscountCodeByEmail,
  deleteDiscountCodeFromDB
};

// src/utility/sendRegistrationPaymentLinkMail .ts
var sendRegistrationPaymentLinkMail = async ({
  fullName,
  email,
  role,
  paymentLink
}) => {
  await sendCustomMail_default({
    to: email,
    subject: "Complete Your World Elite Membership Payment",
    text: `Hello ${fullName},

Your World Elite registration has been reviewed.

Please complete your membership payment using the following link to activate your account:

${paymentLink}

Role: ${role}

Thank you,
World Elite Team`,
    html: `
      <div
        style="
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            padding: 32px 24px;
          "
        >
          <div
            style="
              background-color: #ffffff;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            "
          >
            <h2
              style="
                margin: 0 0 24px;
                font-size: 24px;
                line-height: 1.3;
                color: #111827;
                text-align: center;
              "
            >
              Complete Your Membership Payment
            </h2>

            <p
              style="
                margin: 0 0 16px;
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
              "
            >
              Hello ${fullName},
            </p>

            <p
              style="
                margin: 0 0 16px;
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
              "
            >
              Your World Elite registration has been reviewed. Please complete
              your membership payment using the button below to activate your
              account.
            </p>

            <div
              style="
                margin: 22px 0;
                padding: 18px;
                background-color: #f3f4f6;
                border-radius: 10px;
              "
            >
              <p
                style="
                  margin: 0;
                  font-size: 15px;
                  color: #111827;
                "
              >
                <strong>Role:</strong> ${role}
              </p>
            </div>

            <div
              style="
                text-align: center;
                margin: 28px 0;
              "
            >
              <a
                href="${paymentLink}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  background-color: #111827;
                  color: #ffffff;
                  padding: 12px 28px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-size: 15px;
                  font-weight: 600;
                  display: inline-block;
                "
              >
                Complete Payment
              </a>
            </div>

            <p
              style="
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
                color: #6b7280;
                word-break: break-all;
              "
            >
              Or copy and paste this link into your browser:
              <br />
              <a
                href="${paymentLink}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  color: #2563eb;
                  text-decoration: underline;
                "
              >
                ${paymentLink}
              </a>
            </p>

            <p
              style="
                margin: 25px 0 0;
                font-size: 14px;
                line-height: 1.6;
                color: #6b7280;
              "
            >
              Thank you,
              <br />
              World Elite Team
            </p>
          </div>
        </div>
      </div>
    `
  });
};

// src/modules/invictus-payments/invictus.payment.service.ts
import Stripe from "stripe";
import { Types as Types16 } from "mongoose";

// src/modules/challengePillars/challenge.pillar.model.schema.ts
import { Schema as Schema12, model as model12 } from "mongoose";

// src/modules/challengePillars/challenge.pillar.interface.ts
var PILLAR_NAMES = ["FEARLESS", "LIMITLESS", "BORDERLESS"];
var PILLAR_SLUGS = ["fearless", "limitless", "borderless"];
var PILLAR_ICONS = ["crown", "infinity", "globe"];
var PILLAR_STATUSES = ["draft", "published", "archived"];
var INTRO_VIDEO_STATUSES = [
  "not_uploaded",
  "processing",
  "ready",
  "failed"
];

// src/modules/challengePillars/challenge.pillar.model.schema.ts
var pillarIntroVideoSchema = new Schema12(
  {
    cloudinaryPublicId: {
      type: String,
      trim: true
    },
    cloudinaryAssetId: {
      type: String,
      trim: true
    },
    secureUrl: {
      type: String,
      trim: true
    },
    playbackUrl: {
      type: String,
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    durationSeconds: {
      type: Number,
      min: 0
    },
    format: {
      type: String,
      trim: true
    },
    bytes: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: INTRO_VIDEO_STATUSES,
      default: "not_uploaded"
    }
  },
  {
    _id: false
  }
);
var challengePillarSchema = new Schema12(
  {
    name: {
      type: String,
      enum: PILLAR_NAMES,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      enum: PILLAR_SLUGS,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3e3
    },
    icon: {
      type: String,
      enum: PILLAR_ICONS,
      required: true
    },
    accentColor: {
      type: String,
      default: "#C9A84C",
      trim: true
    },
    isPaid: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    priceCents: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      enum: ["usd"],
      default: "usd"
    },
    stripePriceId: {
      type: String,
      trim: true
    },
    introVideo: {
      type: pillarIntroVideoSchema,
      default: () => ({
        status: "not_uploaded"
      })
    },
    order: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 3
    },
    status: {
      type: String,
      enum: PILLAR_STATUSES,
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    createdBy: {
      type: Schema12.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema12.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "challengepillars"
  }
);
challengePillarSchema.index({
  status: 1,
  order: 1
});
challengePillarSchema.index({
  isPaid: 1,
  status: 1
});
var ChallengePillar = model12(
  "ChallengePillar",
  challengePillarSchema
);

// src/modules/retreatBatches/retreat.batch.model.schema.ts
import { model as model13, Schema as Schema13 } from "mongoose";

// src/modules/retreatBatches/retreat.batch.interface.ts
var RETREAT_BATCH_STATUSES = [
  "upcoming",
  "open",
  "sold_out",
  "in_progress",
  "completed",
  "cancelled"
];

// src/modules/retreatBatches/retreat.batch.model.schema.ts
var retreatBatchSchema = new Schema13(
  {
    retreatLocation: {
      type: Schema13.Types.ObjectId,
      ref: "RetreatLocation",
      required: true,
      index: true
    },
    batchName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    confirmedBookingsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    waitlistCount: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    depositAmount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: RETREAT_BATCH_STATUSES,
      default: "upcoming",
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    bookingDeadline: {
      type: Date
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3e3
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2e3
    },
    createdBy: {
      type: Schema13.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema13.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "retreatbatches"
  }
);
retreatBatchSchema.index({
  retreatLocation: 1,
  status: 1
});
retreatBatchSchema.index({
  startDate: 1,
  endDate: 1
});
var RetreatBatch = model13(
  "RetreatBatch",
  retreatBatchSchema
);

// src/modules/paymentPlans/payment.plan.model.schema.ts
import {
  model as model14,
  Schema as Schema14
} from "mongoose";

// src/modules/paymentPlans/payment.plan.interface.ts
var PAYMENT_PLAN_MODES = [
  "one_time",
  "subscription"
];
var PAYMENT_PLAN_PRODUCT_TYPES = [
  "membership",
  "pillar",
  "retreat",
  "event",
  "other"
];
var PAYMENT_PLAN_PRODUCT_REF_MODELS = [
  "ChallengePillar",
  "RetreatBatch"
];
var PAYMENT_PLAN_INTERVALS = [
  "day",
  "week",
  "month",
  "year"
];
var PAYMENT_PLAN_STATUSES = [
  "draft",
  "active",
  "archived"
];

// src/modules/paymentPlans/payment.plan.model.schema.ts
var paymentPlanSchema = new Schema14(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2e3
    },
    productType: {
      type: String,
      enum: PAYMENT_PLAN_PRODUCT_TYPES,
      required: true,
      index: true
    },
    product: {
      type: Schema14.Types.ObjectId,
      refPath: "productRefModel"
    },
    productRefModel: {
      type: String,
      enum: PAYMENT_PLAN_PRODUCT_REF_MODELS
    },
    mode: {
      type: String,
      enum: PAYMENT_PLAN_MODES,
      required: true
    },
    amountCents: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true
    },
    interval: {
      type: String,
      enum: PAYMENT_PLAN_INTERVALS
    },
    intervalCount: {
      type: Number,
      min: 1,
      default: 1
    },
    stripeProductId: {
      type: String,
      trim: true
    },
    stripePriceId: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true
    },
    status: {
      type: String,
      enum: PAYMENT_PLAN_STATUSES,
      default: "draft",
      index: true
    },
    order: {
      type: Number,
      default: 1,
      min: 1
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    createdBy: {
      type: Schema14.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema14.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "paymentplans"
  }
);
paymentPlanSchema.index({
  productType: 1,
  status: 1,
  order: 1
});
paymentPlanSchema.index({
  product: 1,
  productRefModel: 1
});
paymentPlanSchema.index({
  mode: 1,
  status: 1
});
paymentPlanSchema.index(
  {
    product: 1,
    mode: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      product: { $exists: true }
    }
  }
);
var PaymentPlan = model14(
  "PaymentPlan",
  paymentPlanSchema
);

// src/modules/userEntitlements/userEntitlements.service.ts
import { Types as Types15 } from "mongoose";

// src/modules/userEntitlements/userEntitlements.model.schema.ts
import { model as model15, Schema as Schema15 } from "mongoose";

// src/modules/userEntitlements/userEntitlements.interface.ts
var ENTITLEMENT_TYPES = [
  "pillar",
  "bundle",
  "event",
  "retreat"
];
var ENTITLEMENT_SOURCES = [
  "stripe",
  "admin",
  "promotion",
  "complimentary",
  "migration"
];
var ADMIN_ENTITLEMENT_SOURCES = [
  "admin",
  "promotion",
  "complimentary",
  "migration"
];
var ENTITLEMENT_STATUSES = [
  "active",
  "revoked",
  "refunded",
  "expired"
];

// src/modules/userEntitlements/userEntitlements.model.schema.ts
var userEntitlementSchema = new Schema15(
  {
    user: {
      type: Schema15.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    entitlementType: {
      type: String,
      enum: ENTITLEMENT_TYPES,
      required: true,
      index: true
    },
    entitlementKey: {
      type: String,
      required: true,
      trim: true
    },
    pillar: {
      type: Schema15.Types.ObjectId,
      ref: "ChallengePillar",
      index: true
    },
    targetId: {
      type: Schema15.Types.ObjectId,
      index: true
    },
    source: {
      type: String,
      enum: ENTITLEMENT_SOURCES,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ENTITLEMENT_STATUSES,
      default: "active",
      required: true,
      index: true
    },
    paymentSession: {
      type: Schema15.Types.ObjectId,
      ref: "PaymentSession",
      index: true
    },
    startsAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      index: true
    },
    grantedBy: {
      type: Schema15.Types.ObjectId,
      ref: "User"
    },
    statusChangedBy: {
      type: Schema15.Types.ObjectId,
      ref: "User"
    },
    statusReason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    revokedAt: {
      type: Date
    },
    refundedAt: {
      type: Date
    },
    expiredAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: "userentitlements"
  }
);
userEntitlementSchema.index(
  {
    user: 1,
    entitlementKey: 1
  },
  {
    unique: true
  }
);
userEntitlementSchema.index({
  user: 1,
  status: 1,
  startsAt: 1,
  expiresAt: 1
});
userEntitlementSchema.index({
  user: 1,
  pillar: 1,
  status: 1
});
userEntitlementSchema.index({
  entitlementType: 1,
  status: 1,
  createdAt: -1
});
var UserEntitlement = model15(
  "UserEntitlement",
  userEntitlementSchema
);

// src/modules/entitlementLogs/entitlementlog.service.ts
import { Types as Types14 } from "mongoose";

// src/modules/entitlementLogs/entitlement.model.schema.ts
import { model as model16, Schema as Schema16 } from "mongoose";

// src/modules/entitlementLogs/entitlementlog.interface.ts
var ENTITLEMENT_LOG_ACTIONS = [
  "granted",
  "reactivated",
  "revoked",
  "refunded",
  "expired"
];
var ENTITLEMENT_LOG_SOURCES = [
  "stripe",
  "admin",
  "promotion",
  "complimentary",
  "migration",
  "system"
];

// src/modules/entitlementLogs/entitlement.model.schema.ts
var entitlementLogSchema = new Schema16(
  {
    user: {
      type: Schema16.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    entitlement: {
      type: Schema16.Types.ObjectId,
      ref: "UserEntitlement",
      required: true,
      index: true
    },
    pillar: {
      type: Schema16.Types.ObjectId,
      ref: "ChallengePillar",
      index: true
    },
    paymentSession: {
      type: Schema16.Types.ObjectId,
      ref: "PaymentSession",
      index: true
    },
    action: {
      type: String,
      enum: ENTITLEMENT_LOG_ACTIONS,
      required: true,
      index: true
    },
    source: {
      type: String,
      enum: ENTITLEMENT_LOG_SOURCES,
      required: true,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    actor: {
      type: Schema16.Types.ObjectId,
      ref: "User",
      index: true
    },
    metadata: {
      type: Schema16.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: "entitlementslog"
  }
);
entitlementLogSchema.index({
  user: 1,
  createdAt: -1
});
entitlementLogSchema.index({
  entitlement: 1,
  createdAt: -1
});
entitlementLogSchema.index({
  action: 1,
  createdAt: -1
});
var EntitlementLog = model16(
  "EntitlementLog",
  entitlementLogSchema
);

// src/modules/entitlementLogs/entitlementlog.service.ts
var throwServiceError3 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound3 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError3(message, statusCode);
  }
};
var assertValidObjectId2 = (value, fieldName) => {
  if (!Types14.ObjectId.isValid(value)) {
    throwServiceError3(`${fieldName} is invalid`, 400);
  }
};
var ensureUserExists = async (userId) => {
  assertValidObjectId2(userId, "User ID");
  const user = await User.findById(userId).select("_id fullName email role");
  assertFound3(user, "User not found", 404);
  return user;
};
var ensureEntitlementExists = async (entitlementId) => {
  assertValidObjectId2(entitlementId, "Entitlement ID");
  const entitlement = await UserEntitlement.findById(entitlementId);
  assertFound3(entitlement, "User entitlement not found", 404);
  return entitlement;
};
var createEntitlementLog = async (payload) => {
  await ensureUserExists(payload.user);
  const entitlement = await ensureEntitlementExists(payload.entitlement);
  if (payload.pillar) {
    assertValidObjectId2(payload.pillar, "Pillar ID");
  }
  if (payload.paymentSession) {
    assertValidObjectId2(payload.paymentSession, "Payment session ID");
  }
  if (payload.actor) {
    assertValidObjectId2(payload.actor, "Actor ID");
  }
  const createData = {
    user: new Types14.ObjectId(payload.user),
    entitlement: new Types14.ObjectId(payload.entitlement),
    action: payload.action,
    source: payload.source
  };
  const pillarId = payload.pillar ?? entitlement.pillar?.toString();
  if (pillarId) {
    createData.pillar = new Types14.ObjectId(pillarId);
  }
  const paymentSessionId = payload.paymentSession ?? entitlement.paymentSession?.toString();
  if (paymentSessionId) {
    createData.paymentSession = new Types14.ObjectId(paymentSessionId);
  }
  if (payload.reason !== void 0) {
    createData.reason = payload.reason;
  }
  if (payload.actor) {
    createData.actor = new Types14.ObjectId(payload.actor);
  }
  if (payload.metadata !== void 0) {
    createData.metadata = payload.metadata;
  }
  const log = await EntitlementLog.create(createData);
  const populated = await EntitlementLog.findById(log._id).populate("user", "fullName email role").populate("entitlement", "entitlementType entitlementKey status").populate("pillar", "name slug title").populate("paymentSession", "purpose status amountTotal currency").populate("actor", "fullName email role");
  assertFound3(populated, "Entitlement log not found after creation", 500);
  return populated;
};
var getAllEntitlementLogs = async (options2) => {
  const page = options2.page ?? 1;
  const limit = options2.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (options2.userId) {
    assertValidObjectId2(options2.userId, "User ID");
    filter.user = new Types14.ObjectId(options2.userId);
  }
  if (options2.entitlementId) {
    assertValidObjectId2(options2.entitlementId, "Entitlement ID");
    filter.entitlement = new Types14.ObjectId(options2.entitlementId);
  }
  if (options2.pillarId) {
    assertValidObjectId2(options2.pillarId, "Pillar ID");
    filter.pillar = new Types14.ObjectId(options2.pillarId);
  }
  if (options2.action) {
    filter.action = options2.action;
  }
  if (options2.source) {
    filter.source = options2.source;
  }
  const [data, total] = await Promise.all([
    EntitlementLog.find(filter).sort({
      createdAt: -1
    }).skip(skip).limit(limit).populate("user", "fullName email role").populate("entitlement", "entitlementType entitlementKey status").populate("pillar", "name slug title").populate("paymentSession", "purpose status amountTotal currency").populate("actor", "fullName email role"),
    EntitlementLog.countDocuments(filter)
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getMyEntitlementLogs = async (userId) => {
  assertValidObjectId2(userId, "User ID");
  const logs = await EntitlementLog.find({
    user: new Types14.ObjectId(userId)
  }).sort({
    createdAt: -1
  }).populate("entitlement", "entitlementType entitlementKey status").populate("pillar", "name slug title");
  return logs;
};
var getSingleEntitlementLog = async (logId) => {
  assertValidObjectId2(logId, "Entitlement log ID");
  const log = await EntitlementLog.findById(logId).populate("user", "fullName email role").populate("entitlement", "entitlementType entitlementKey status").populate("pillar", "name slug title").populate("paymentSession", "purpose status amountTotal currency").populate("actor", "fullName email role");
  assertFound3(log, "Entitlement log not found", 404);
  return log;
};
var entitlementLogService = {
  createEntitlementLog,
  getAllEntitlementLogs,
  getMyEntitlementLogs,
  getSingleEntitlementLog
};

// src/modules/userEntitlements/userEntitlements.service.ts
var throwServiceError4 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound4 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError4(message, statusCode);
  }
};
var assertValidObjectId3 = (value, fieldName) => {
  if (!Types15.ObjectId.isValid(value)) {
    throwServiceError4(`${fieldName} is invalid`, 400);
  }
};
var safeLogEntitlementEvent = async (params) => {
  try {
    await entitlementLogService.createEntitlementLog({
      user: params.userId,
      entitlement: params.entitlementId,
      action: params.action,
      source: params.source,
      ...params.pillarId ? { pillar: params.pillarId } : {},
      ...params.paymentSessionId ? { paymentSession: params.paymentSessionId } : {},
      ...params.actorId ? { actor: params.actorId } : {},
      ...params.reason !== void 0 ? { reason: params.reason } : {}
    });
  } catch (error) {
    console.error("Failed to write entitlement log:", error);
  }
};
var isDuplicateKeyError = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var parseOptionalDate = (value) => {
  return value ? new Date(value) : /* @__PURE__ */ new Date();
};
var parseNullableDate = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  return new Date(value);
};
var buildEntitlementKey = ({
  entitlementType,
  pillarId,
  targetId
}) => {
  if (entitlementType === "pillar") {
    if (!pillarId) {
      throwServiceError4("Pillar ID is required", 400);
    }
    return `pillar:${pillarId}`;
  }
  if (!targetId) {
    throwServiceError4("Target ID is required", 400);
  }
  return `${entitlementType}:${targetId}`;
};
var validateDateRange = (startsAt, expiresAt) => {
  if (expiresAt && expiresAt <= startsAt) {
    throwServiceError4("expiresAt must be later than startsAt", 400);
  }
};
var populateEntitlement = (entitlementId) => {
  return UserEntitlement.findById(entitlementId).populate("user", "fullName email role accessTo profileImage accountStatus").populate("pillar", "name slug title isPaid priceCents currency status").populate(
    "paymentSession",
    "purpose status stripeCheckoutSessionId amountTotal currency"
  ).populate("grantedBy", "fullName email role profileImage").populate("statusChangedBy", "fullName email role profileImage");
};
var expirePastEntitlements = async (userId) => {
  const now = /* @__PURE__ */ new Date();
  const filter = {
    status: "active",
    expiresAt: {
      $lte: now
    }
  };
  if (userId) {
    filter.user = new Types15.ObjectId(userId);
  }
  await UserEntitlement.updateMany(filter, {
    $set: {
      status: "expired",
      expiredAt: now
    }
  });
};
var ensureUserExists2 = async (userId) => {
  assertValidObjectId3(userId, "User ID");
  const user = await User.findById(userId).select(
    "_id fullName email role accessTo accountStatus"
  );
  assertFound4(user, "User not found", 404);
  return user;
};
var ensurePillarExists = async (pillarId) => {
  assertValidObjectId3(pillarId, "Pillar ID");
  const pillar = await ChallengePillar.findById(pillarId);
  assertFound4(pillar, "Challenge pillar not found", 404);
  if (pillar.status === "archived") {
    throwServiceError4("Cannot grant access to an archived pillar", 400);
  }
  return pillar;
};
var grantEntitlementInternal = async (input) => {
  await ensureUserExists2(input.userId);
  if (input.entitlementType === "pillar") {
    if (!input.pillarId) {
      throwServiceError4("Pillar ID is required", 400);
    }
    await ensurePillarExists(input.pillarId);
  } else {
    if (!input.targetId) {
      throwServiceError4("Target ID is required", 400);
    }
    assertValidObjectId3(input.targetId, "Target ID");
  }
  if (input.paymentSessionId) {
    assertValidObjectId3(input.paymentSessionId, "Payment session ID");
  }
  if (input.grantedBy) {
    assertValidObjectId3(input.grantedBy, "Granted by user ID");
  }
  validateDateRange(input.startsAt, input.expiresAt);
  const entitlementKey = buildEntitlementKey({
    entitlementType: input.entitlementType,
    pillarId: input.pillarId,
    targetId: input.targetId
  });
  const existingEntitlement = await UserEntitlement.findOne({
    user: new Types15.ObjectId(input.userId),
    entitlementKey
  });
  if (existingEntitlement) {
    existingEntitlement.entitlementType = input.entitlementType;
    existingEntitlement.entitlementKey = entitlementKey;
    existingEntitlement.source = input.source;
    existingEntitlement.status = "active";
    existingEntitlement.startsAt = input.startsAt;
    existingEntitlement.set("expiresAt", input.expiresAt);
    if (input.entitlementType === "pillar") {
      existingEntitlement.pillar = new Types15.ObjectId(input.pillarId);
      existingEntitlement.set("targetId", void 0);
    } else {
      existingEntitlement.targetId = new Types15.ObjectId(input.targetId);
      existingEntitlement.set("pillar", void 0);
    }
    existingEntitlement.set(
      "paymentSession",
      input.paymentSessionId ? new Types15.ObjectId(input.paymentSessionId) : void 0
    );
    existingEntitlement.set(
      "grantedBy",
      input.grantedBy ? new Types15.ObjectId(input.grantedBy) : void 0
    );
    existingEntitlement.set("statusChangedBy", void 0);
    existingEntitlement.set("statusReason", void 0);
    existingEntitlement.set("revokedAt", void 0);
    existingEntitlement.set("refundedAt", void 0);
    existingEntitlement.set("expiredAt", void 0);
    await existingEntitlement.save();
    await safeLogEntitlementEvent({
      userId: input.userId,
      entitlementId: existingEntitlement._id.toString(),
      action: "reactivated",
      source: input.source,
      ...input.pillarId ? { pillarId: input.pillarId } : {},
      ...input.paymentSessionId ? { paymentSessionId: input.paymentSessionId } : {},
      ...input.grantedBy ? { actorId: input.grantedBy } : {}
    });
    const populated = await populateEntitlement(existingEntitlement._id);
    assertFound4(populated, "Entitlement not found after update", 500);
    return populated;
  }
  const createData = {
    user: new Types15.ObjectId(input.userId),
    entitlementType: input.entitlementType,
    entitlementKey,
    source: input.source,
    status: "active",
    startsAt: input.startsAt
  };
  if (input.entitlementType === "pillar") {
    createData.pillar = new Types15.ObjectId(input.pillarId);
  } else {
    createData.targetId = new Types15.ObjectId(input.targetId);
  }
  if (input.expiresAt) {
    createData.expiresAt = input.expiresAt;
  }
  if (input.paymentSessionId) {
    createData.paymentSession = new Types15.ObjectId(input.paymentSessionId);
  }
  if (input.grantedBy) {
    createData.grantedBy = new Types15.ObjectId(input.grantedBy);
  }
  try {
    const entitlement = await UserEntitlement.create(createData);
    await safeLogEntitlementEvent({
      userId: input.userId,
      entitlementId: entitlement._id.toString(),
      action: "granted",
      source: input.source,
      ...input.pillarId ? { pillarId: input.pillarId } : {},
      ...input.paymentSessionId ? { paymentSessionId: input.paymentSessionId } : {},
      ...input.grantedBy ? { actorId: input.grantedBy } : {}
    });
    const populated = await populateEntitlement(entitlement._id);
    assertFound4(populated, "Entitlement not found after creation", 500);
    return populated;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const entitlement = await UserEntitlement.findOne({
        user: new Types15.ObjectId(input.userId),
        entitlementKey
      });
      assertFound4(
        entitlement,
        "Existing entitlement could not be retrieved",
        409
      );
      return entitlement;
    }
    throw error;
  }
};
var grantEntitlementByAdmin = async (payload, actorId) => {
  const entitlementType = payload.entitlementType ?? "pillar";
  const startsAt = parseOptionalDate(payload.startsAt);
  const expiresAt = parseNullableDate(payload.expiresAt);
  return grantEntitlementInternal({
    userId: payload.user,
    entitlementType,
    ...payload.pillar !== void 0 ? {
      pillarId: payload.pillar
    } : {},
    ...payload.targetId !== void 0 ? {
      targetId: payload.targetId
    } : {},
    source: payload.source ?? "admin",
    ...payload.paymentSession !== void 0 ? {
      paymentSessionId: payload.paymentSession
    } : {},
    startsAt,
    ...expiresAt !== void 0 ? { expiresAt } : {},
    grantedBy: actorId
  });
};
var activatePillarEntitlementFromPayment = async (payload) => {
  return grantEntitlementInternal({
    userId: payload.userId,
    entitlementType: "pillar",
    pillarId: payload.pillarId,
    source: "stripe",
    paymentSessionId: payload.paymentSessionId,
    startsAt: payload.startsAt ?? /* @__PURE__ */ new Date(),
    ...payload.expiresAt !== void 0 ? {
      expiresAt: payload.expiresAt
    } : {}
  });
};
var activateEntitlementFromPayment = async (payload) => {
  return grantEntitlementInternal({
    userId: payload.userId,
    entitlementType: payload.entitlementType,
    ...payload.pillarId !== void 0 ? { pillarId: payload.pillarId } : {},
    ...payload.targetId !== void 0 ? { targetId: payload.targetId } : {},
    source: "stripe",
    paymentSessionId: payload.paymentSessionId,
    startsAt: payload.startsAt ?? /* @__PURE__ */ new Date(),
    ...payload.expiresAt !== void 0 ? { expiresAt: payload.expiresAt } : {}
  });
};
var hasActivePillarEntitlement = async (userId, pillarId) => {
  assertValidObjectId3(userId, "User ID");
  assertValidObjectId3(pillarId, "Pillar ID");
  await expirePastEntitlements(userId);
  const now = /* @__PURE__ */ new Date();
  const filter = {
    user: new Types15.ObjectId(userId),
    entitlementType: "pillar",
    pillar: new Types15.ObjectId(pillarId),
    status: "active",
    startsAt: {
      $lte: now
    },
    $or: [
      {
        expiresAt: {
          $exists: false
        }
      },
      {
        expiresAt: {
          $gt: now
        }
      }
    ]
  };
  const entitlement = await UserEntitlement.exists(filter);
  return Boolean(entitlement);
};
var checkPillarAccess = async (userId, pillarId) => {
  assertValidObjectId3(userId, "User ID");
  assertValidObjectId3(pillarId, "Pillar ID");
  const pillar = await ChallengePillar.findOne({
    _id: pillarId,
    status: "published"
  }).select("name slug title isPaid priceCents currency status");
  assertFound4(pillar, "Challenge pillar not found or unavailable", 404);
  if (!pillar.isPaid) {
    return {
      hasAccess: true,
      accessType: "free",
      reason: "free_pillar",
      pillar,
      entitlement: null
    };
  }
  await expirePastEntitlements(userId);
  const now = /* @__PURE__ */ new Date();
  const entitlement = await UserEntitlement.findOne({
    user: new Types15.ObjectId(userId),
    entitlementType: "pillar",
    pillar: new Types15.ObjectId(pillarId),
    status: "active",
    startsAt: {
      $lte: now
    },
    $or: [
      {
        expiresAt: {
          $exists: false
        }
      },
      {
        expiresAt: {
          $gt: now
        }
      }
    ]
  }).populate("paymentSession", "status purpose amountTotal currency");
  if (!entitlement) {
    return {
      hasAccess: false,
      accessType: "locked",
      reason: "pillar_purchase_required",
      pillar,
      entitlement: null
    };
  }
  return {
    hasAccess: true,
    accessType: "purchased",
    reason: "active_pillar_entitlement",
    pillar,
    entitlement
  };
};
var getMyEntitlements = async (userId) => {
  assertValidObjectId3(userId, "User ID");
  await expirePastEntitlements(userId);
  const entitlements = await UserEntitlement.find({
    user: new Types15.ObjectId(userId)
  }).sort({
    createdAt: -1
  }).populate("pillar", "name slug title isPaid priceCents currency status").populate(
    "paymentSession",
    "purpose status amountTotal currency stripeCheckoutSessionId"
  );
  const now = /* @__PURE__ */ new Date();
  return entitlements.map((entitlement) => {
    const isCurrentlyActive = entitlement.status === "active" && entitlement.startsAt <= now && (!entitlement.expiresAt || entitlement.expiresAt > now);
    return {
      ...entitlement.toObject(),
      hasAccess: isCurrentlyActive
    };
  });
};
var getAllEntitlements = async (options2) => {
  await expirePastEntitlements();
  const page = options2.page ?? 1;
  const limit = options2.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (options2.userId) {
    assertValidObjectId3(options2.userId, "User ID");
    filter.user = new Types15.ObjectId(options2.userId);
  }
  if (options2.pillarId) {
    assertValidObjectId3(options2.pillarId, "Pillar ID");
    filter.pillar = new Types15.ObjectId(options2.pillarId);
  }
  if (options2.entitlementType) {
    filter.entitlementType = options2.entitlementType;
  }
  if (options2.source) {
    filter.source = options2.source;
  }
  if (options2.status) {
    filter.status = options2.status;
  }
  const [data, total] = await Promise.all([
    UserEntitlement.find(filter).sort({
      createdAt: -1
    }).skip(skip).limit(limit).populate(
      "user",
      "fullName email role accessTo profileImage accountStatus"
    ).populate("pillar", "name slug title isPaid priceCents currency status").populate(
      "paymentSession",
      "purpose status amountTotal currency stripeCheckoutSessionId"
    ).populate("grantedBy", "fullName email role").populate("statusChangedBy", "fullName email role"),
    UserEntitlement.countDocuments(filter)
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getSingleEntitlement = async (entitlementId) => {
  assertValidObjectId3(entitlementId, "Entitlement ID");
  const entitlement = await populateEntitlement(entitlementId);
  assertFound4(entitlement, "User entitlement not found", 404);
  return entitlement;
};
var changeEntitlementStatus = async (input) => {
  assertValidObjectId3(input.entitlementId, "Entitlement ID");
  assertValidObjectId3(input.actorId, "Actor ID");
  const entitlement = await UserEntitlement.findById(input.entitlementId);
  assertFound4(entitlement, "User entitlement not found", 404);
  entitlement.status = input.status;
  entitlement.statusChangedBy = new Types15.ObjectId(input.actorId);
  if (input.reason !== void 0) {
    entitlement.statusReason = input.reason;
  } else {
    entitlement.set("statusReason", void 0);
  }
  const now = /* @__PURE__ */ new Date();
  if (input.status === "revoked") {
    entitlement.revokedAt = now;
    entitlement.set("refundedAt", void 0);
    entitlement.set("expiredAt", void 0);
  }
  if (input.status === "refunded") {
    entitlement.refundedAt = now;
    entitlement.set("revokedAt", void 0);
    entitlement.set("expiredAt", void 0);
  }
  if (input.status === "expired") {
    entitlement.expiredAt = now;
    entitlement.set("revokedAt", void 0);
    entitlement.set("refundedAt", void 0);
  }
  await entitlement.save();
  await safeLogEntitlementEvent({
    userId: entitlement.user.toString(),
    entitlementId: entitlement._id.toString(),
    action: input.status,
    source: entitlement.source,
    ...entitlement.pillar ? { pillarId: entitlement.pillar.toString() } : {},
    ...entitlement.paymentSession ? { paymentSessionId: entitlement.paymentSession.toString() } : {},
    actorId: input.actorId,
    ...input.reason !== void 0 ? { reason: input.reason } : {}
  });
  const populated = await populateEntitlement(entitlement._id);
  assertFound4(populated, "Entitlement not found after status update", 500);
  return populated;
};
var revokeEntitlement = async (entitlementId, payload, actorId) => {
  return changeEntitlementStatus({
    entitlementId,
    status: "revoked",
    actorId,
    ...payload.reason !== void 0 ? {
      reason: payload.reason
    } : {}
  });
};
var refundEntitlement = async (entitlementId, payload, actorId) => {
  return changeEntitlementStatus({
    entitlementId,
    status: "refunded",
    actorId,
    ...payload.reason !== void 0 ? {
      reason: payload.reason
    } : {}
  });
};
var expireEntitlement = async (entitlementId, payload, actorId) => {
  return changeEntitlementStatus({
    entitlementId,
    status: "expired",
    actorId,
    ...payload.reason !== void 0 ? {
      reason: payload.reason
    } : {}
  });
};
var reactivateEntitlement = async (entitlementId, payload, actorId) => {
  assertValidObjectId3(entitlementId, "Entitlement ID");
  const entitlement = await UserEntitlement.findById(entitlementId);
  assertFound4(entitlement, "User entitlement not found", 404);
  const startsAt = parseOptionalDate(payload.startsAt);
  const expiresAt = parseNullableDate(payload.expiresAt);
  validateDateRange(startsAt, expiresAt);
  entitlement.status = "active";
  entitlement.source = payload.source ?? "admin";
  entitlement.startsAt = startsAt;
  entitlement.set("expiresAt", expiresAt);
  entitlement.grantedBy = new Types15.ObjectId(actorId);
  entitlement.set("statusChangedBy", void 0);
  entitlement.set("statusReason", void 0);
  entitlement.set("revokedAt", void 0);
  entitlement.set("refundedAt", void 0);
  entitlement.set("expiredAt", void 0);
  entitlement.set("paymentSession", void 0);
  await entitlement.save();
  await safeLogEntitlementEvent({
    userId: entitlement.user.toString(),
    entitlementId: entitlement._id.toString(),
    action: "reactivated",
    source: entitlement.source,
    ...entitlement.pillar ? { pillarId: entitlement.pillar.toString() } : {},
    actorId
  });
  const populated = await populateEntitlement(entitlement._id);
  assertFound4(populated, "Entitlement not found after reactivation", 500);
  return populated;
};
var userEntitlementService = {
  grantEntitlementByAdmin,
  activatePillarEntitlementFromPayment,
  activateEntitlementFromPayment,
  hasActivePillarEntitlement,
  checkPillarAccess,
  getMyEntitlements,
  getAllEntitlements,
  getSingleEntitlement,
  revokeEntitlement,
  refundEntitlement,
  expireEntitlement,
  reactivateEntitlement
};

// src/modules/invictus-payments/invictus.payment.service.ts
var throwServiceError5 = (message, statusCode) => {
  const error = new Error(
    message
  );
  error.statusCode = statusCode;
  throw error;
};
var assertFound5 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError5(
      message,
      statusCode
    );
  }
};
var stripUndefined = (obj) => {
  const result = {};
  for (const key in obj) {
    if (obj[key] !== void 0) {
      result[key] = obj[key];
    }
  }
  return result;
};
var stripeSecretKey = config_default.STRIPE_SECRET_KEY;
var stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
var getStripeClient = () => {
  if (!stripe) {
    throwServiceError5(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY.",
      500
    );
  }
  return stripe;
};
var productLookup = {
  ChallengePillar: {
    findById: (id3) => ChallengePillar.findById(id3)
  },
  RetreatBatch: {
    findById: (id3) => RetreatBatch.findById(id3)
  }
};
var entitlementTypeForProductType = {
  pillar: "pillar",
  retreat: "retreat",
  event: "event"
};
var createInvictusCheckoutSession = async ({
  userId,
  fullName,
  email,
  input
}) => {
  if (!Types16.ObjectId.isValid(
    input.paymentPlanId
  )) {
    throwServiceError5(
      "Payment plan ID is invalid",
      400
    );
  }
  const plan = await PaymentPlan.findById(
    input.paymentPlanId
  );
  assertFound5(
    plan,
    "Payment plan not found",
    404
  );
  if (plan.status !== "active") {
    throwServiceError5(
      "This payment plan is not currently available for purchase",
      400
    );
  }
  if (plan.productType === "membership") {
    throwServiceError5(
      "Membership plans must be purchased through the membership checkout flow",
      400
    );
  }
  if (plan.mode !== "one_time") {
    throwServiceError5(
      "Only one-time payment plans can be purchased through this endpoint",
      400
    );
  }
  if (plan.product && plan.productRefModel) {
    const lookup = productLookup[plan.productRefModel];
    const referencedProduct = await lookup.findById(
      plan.product.toString()
    );
    assertFound5(
      referencedProduct,
      "The product linked to this payment plan no longer exists",
      404
    );
  }
  const stripeClient = getStripeClient();
  const sessionCreateParams = {
    mode: "payment",
    line_items: [
      plan.stripePriceId ? {
        price: plan.stripePriceId,
        quantity: 1
      } : {
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: plan.amountCents,
          product_data: {
            name: plan.name,
            description: plan.description
          }
        }
      }
    ],
    customer_email: email,
    success_url: `${config_default.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config_default.FRONTEND_URL}/payment/cancel`,
    metadata: {
      purpose: "invictus_purchase",
      userId,
      fullName,
      email,
      paymentPlanId: plan._id.toString(),
      productType: plan.productType,
      product: plan.product?.toString() ?? "",
      productRefModel: plan.productRefModel ?? ""
    }
  };
  const session = await stripeClient.checkout.sessions.create(
    sessionCreateParams
  );
  if (!session.url) {
    throwServiceError5(
      "Failed to create Stripe Checkout session",
      500
    );
  }
  await PaymentSession.create(
    stripUndefined({
      user: userId,
      purpose: "invictus_purchase",
      status: "pending",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : void 0,
      checkoutUrl: session.url ?? void 0,
      amountTotal: plan.amountCents,
      currency: plan.currency,
      paymentPlan: plan._id,
      product: plan.product,
      productRefModel: plan.productRefModel
    })
  );
  return {
    checkoutUrl: session.url,
    sessionId: session.id
  };
};
var activateInvictusPurchase = async (session) => {
  const paymentSession = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id
  });
  if (!paymentSession) {
    console.error(
      `INVICTUS webhook: no PaymentSession found for checkout ${session.id}`
    );
    return;
  }
  if (paymentSession.status === "paid") {
    return;
  }
  paymentSession.status = "paid";
  if (typeof session.amount_total === "number") {
    paymentSession.amountTotal = session.amount_total;
  }
  await paymentSession.save();
  const userId = paymentSession.user.toString();
  const productType = session.metadata?.productType;
  const productId = session.metadata?.product;
  if (!productType || !productId || productType === "other") {
    return;
  }
  const entitlementType = entitlementTypeForProductType[productType];
  if (!entitlementType) {
    console.warn(
      `INVICTUS webhook: unknown productType "${productType}" for session ${session.id}`
    );
    return;
  }
  await userEntitlementService.activateEntitlementFromPayment(
    {
      userId,
      entitlementType,
      ...entitlementType === "pillar" ? { pillarId: productId } : { targetId: productId },
      paymentSessionId: paymentSession._id.toString()
    }
  );
  paymentSession.entitlementActivatedAt = /* @__PURE__ */ new Date();
  await paymentSession.save();
};
var getMyInvictusPurchases = async (userId) => {
  return PaymentSession.find({
    user: new Types16.ObjectId(userId),
    purpose: "invictus_purchase"
  }).sort({ createdAt: -1 }).populate(
    "paymentPlan",
    "name slug productType mode amountCents currency"
  );
};
var invictusPaymentService = {
  createInvictusCheckoutSession,
  activateInvictusPurchase,
  getMyInvictusPurchases
};

// src/modules/payment/payment.service.ts
var stripeSecretKey2 = config_default.STRIPE_SECRET_KEY;
var stripe2 = stripeSecretKey2 ? new Stripe2(stripeSecretKey2) : null;
var stripUndefined2 = (obj) => {
  const result = {};
  for (const key in obj) {
    if (obj[key] !== void 0) {
      result[key] = obj[key];
    }
  }
  return result;
};
var throwError5 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var getStripeClient2 = () => {
  const stripeClient = stripe2;
  if (!stripeClient) {
    throwError5("Stripe is not configured. Please set STRIPE_SECRET_KEY.", 500);
  }
  return stripeClient;
};
var getPricingPlanByRoleAndAccess = (role, accessTo) => {
  return getPricingByRoleAndAccess(role, accessTo);
};
var addMonths = (date, months) => {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
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
    throwError5("This role does not require Stripe payment", 400);
  }
  const originalPricingPlan = getPricingByRoleAndAccess(role, accessTo);
  if (!originalPricingPlan.requiresPayment || originalPricingPlan.items.length === 0) {
    throwError5("No pricing configured for this role and access type", 500);
  }
  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,
    role,
    accessTo,
    userId
  });
  const finalPricingPlan = discount ? applyDiscountToPricingPlan(originalPricingPlan, discount.discountPercent) : originalPricingPlan;
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
      originalAmountCents: String(originalPricingPlan.totalFirstPaymentCents),
      finalAmountCents: String(finalPricingPlan.totalFirstPaymentCents),
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
  const stripeClient = getStripeClient2();
  const session = await stripeClient.checkout.sessions.create(
    sessionCreateParams
  );
  if (!session.url) {
    throwError5("Failed to create Stripe Checkout session", 500);
  }
  await PaymentSession.create(
    stripUndefined2({
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
var getRegistrationPaymentDetails = async (token) => {
  const paymentLink = await RegistrationPaymentLink.findOne({
    token,
    status: {
      $in: ["active", "checkout_created"]
    }
  });
  if (!paymentLink) {
    throwError5("Payment link is invalid or expired", 404);
  }
  const user = await User.findById(paymentLink.user).select(
    "fullName email role accessTo membershipDurationMonths paymentStatus subscriptionStatus approvalStatus accountStatus"
  );
  assertFound_default(user, "User not found", 404);
  if (!user) {
    throwError5("User not found", 404);
  }
  assertFound_default(user, "User not found", 404);
  if (user.paymentStatus === "paid") {
    return {
      alreadyPaid: true,
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accessTo: user.accessTo,
        durationMonths: user.membershipDurationMonths
      },
      paymentStatus: user.paymentStatus,
      message: "Payment has already been completed."
    };
  }
  if (!user.membershipDurationMonths) {
    throwError5("Membership duration is missing", 400);
  }
  const pricing = getPricingByRoleAndAccess(
    user.role,
    user.accessTo,
    user.membershipDurationMonths
  );
  return {
    alreadyPaid: false,
    user: {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessTo: user.accessTo,
      durationMonths: user.membershipDurationMonths
    },
    pricing,
    paymentStatus: user.paymentStatus
  };
};
var createRegistrationCheckoutByToken = async (token, discountCode) => {
  const paymentLink = await RegistrationPaymentLink.findOne({
    token,
    status: {
      $in: ["active", "checkout_created"]
    }
  });
  if (!paymentLink) {
    throwError5("Invalid or expired payment link", 404);
  }
  const user = await User.findById(paymentLink.user).select("-password");
  if (!user) {
    throwError5("User not found", 404);
  }
  assertFound_default(user, "User not found", 404);
  if (user.paymentStatus === "paid") {
    throwError5("Payment has already been completed", 400);
  }
  if (!user.membershipDurationMonths) {
    throwError5("Membership duration is missing", 400);
  }
  const durationMonths = user.membershipDurationMonths;
  const originalPricing = getPricingByRoleAndAccess(
    user.role,
    user.accessTo,
    durationMonths
  );
  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,
    role: user.role,
    accessTo: user.accessTo,
    userId: String(user._id)
  });
  const finalPricing = discount ? applyDiscountToPricingPlan(originalPricing, discount.discountPercent) : originalPricing;
  const stripeClient = getStripeClient2();
  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    client_reference_id: String(user._id),
    line_items: finalPricing.items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: item.currency,
        unit_amount: item.amountCents,
        product_data: {
          name: item.name,
          description: item.description
        }
      }
    })),
    success_url: `${config_default.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config_default.FRONTEND_URL}/payment/registration/${token}`,
    metadata: {
      userId: String(user._id),
      role: user.role,
      accessTo: user.accessTo,
      purpose: "registration",
      durationMonths: String(durationMonths),
      paymentLinkId: String(paymentLink._id),
      originalAmountCents: String(originalPricing.totalFirstPaymentCents),
      finalAmountCents: String(finalPricing.totalFirstPaymentCents),
      discountCode: discount?.code || "",
      discountPercent: String(discount?.discountPercent || 0)
    }
  });
  if (!session.url) {
    throwError5("Stripe checkout URL was not created", 500);
  }
  await PaymentSession.create({
    user: user._id,
    role: user.role,
    accessTo: user.accessTo,
    durationMonths,
    purpose: "registration",
    status: "pending",
    stripeCheckoutSessionId: session.id,
    checkoutUrl: session.url,
    amountTotal: finalPricing.totalFirstPaymentCents,
    originalAmountTotal: originalPricing.totalFirstPaymentCents,
    discountAmountTotal: originalPricing.totalFirstPaymentCents - finalPricing.totalFirstPaymentCents,
    discountCode: discount?.code,
    discountPercent: discount?.discountPercent,
    currency: "usd"
  });
  await RegistrationPaymentLink.findByIdAndUpdate(paymentLink._id, {
    $set: {
      status: "checkout_created",
      stripeCheckoutSessionId: session.id
    }
  });
  await User.findByIdAndUpdate(user._id, {
    $set: {
      stripeCheckoutSessionId: session.id,
      subscriptionStatus: "incomplete"
    }
  });
  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    user: {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessTo: user.accessTo,
      durationMonths
    },
    originalPricing,
    pricing: finalPricing,
    discount
  };
};
var getPendingRegistrationPayments = async () => {
  const links = await RegistrationPaymentLink.find({
    status: {
      $in: ["active", "checkout_created"]
    }
  }).populate({
    path: "user",
    select: "fullName email phone city country brokerage role accessTo membershipDurationMonths paymentStatus subscriptionStatus approvalStatus accountStatus createdAt"
  }).sort({
    createdAt: -1
  }).lean();
  return links.filter((link) => link.user).map((link) => ({
    ...link,
    paymentLink: `${config_default.FRONTEND_URL}/payment/registration/${link.token}`
  }));
};
var createUpgradeCheckoutSessionIntoStripe = async (userId, durationMonths, discountCode) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throwError5("User not found", 404);
  }
  const currentUser = user;
  if (currentUser.membershipAccessStatus !== "expired") {
    throwError5("Your current membership is still active.", 400);
  }
  if (currentUser.approvalStatus !== "approved" || currentUser.accountStatus !== "active") {
    throwError5("Your account is not eligible for membership renewal.", 403);
  }
  let resolvedDuration = durationMonths;
  if (currentUser.role === "ceo" || currentUser.role === "ceo_partner") {
    resolvedDuration = 12;
  }
  const originalPricing = getPricingByRoleAndAccess(
    currentUser.role,
    currentUser.accessTo,
    resolvedDuration
  );
  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,
    role: currentUser.role,
    accessTo: currentUser.accessTo,
    userId: String(currentUser._id)
  });
  const finalPricing = discount ? applyDiscountToPricingPlan(originalPricing, discount.discountPercent) : originalPricing;
  const stripeClient = getStripeClient2();
  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",
    customer: currentUser.stripeCustomerId || void 0,
    customer_email: currentUser.stripeCustomerId ? void 0 : currentUser.email,
    client_reference_id: String(currentUser._id),
    line_items: finalPricing.items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: item.currency,
        unit_amount: item.amountCents,
        product_data: {
          name: item.name,
          description: `${resolvedDuration} month membership renewal`
        }
      }
    })),
    success_url: `${config_default.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config_default.FRONTEND_URL}/upgrade-plan`,
    metadata: {
      userId: String(currentUser._id),
      role: currentUser.role,
      accessTo: currentUser.accessTo,
      purpose: "upgrade",
      durationMonths: String(resolvedDuration),
      originalAmountCents: String(originalPricing.totalFirstPaymentCents),
      finalAmountCents: String(finalPricing.totalFirstPaymentCents),
      discountCode: discount?.code || "",
      discountPercent: String(discount?.discountPercent ?? 0)
    }
  });
  if (!session.url) {
    throwError5("Stripe Checkout session could not be created.", 500);
  }
  await PaymentSession.create(
    stripUndefined2({
      user: currentUser._id,
      role: currentUser.role,
      accessTo: currentUser.accessTo,
      durationMonths: resolvedDuration,
      purpose: "upgrade",
      status: "pending",
      stripeCheckoutSessionId: session.id,
      checkoutUrl: session.url ?? void 0,
      amountTotal: finalPricing.totalFirstPaymentCents,
      originalAmountTotal: originalPricing.totalFirstPaymentCents,
      discountAmountTotal: originalPricing.totalFirstPaymentCents - finalPricing.totalFirstPaymentCents,
      discountCode: discount?.code,
      discountPercent: discount?.discountPercent,
      currency: "usd"
    })
  );
  await User.findByIdAndUpdate(currentUser._id, {
    $set: {
      stripeCheckoutSessionId: session.id,
      subscriptionStatus: "incomplete"
    }
  });
  return {
    checkoutUrl: session.url ?? null,
    sessionId: session.id,
    role: currentUser.role,
    accessTo: currentUser.accessTo,
    durationMonths: resolvedDuration,
    pricing: finalPricing,
    originalPricing,
    discount
  };
};
var getSubscriptionPeriodEnd = (subscription) => {
  const subscriptionWithPeriod = subscription;
  if (!subscriptionWithPeriod.current_period_end) {
    return void 0;
  }
  return new Date(subscriptionWithPeriod.current_period_end * 1e3);
};
var activateRegistrationPayment = async (session) => {
  const userId = session.metadata?.userId;
  const durationMonths = Number(
    session.metadata?.durationMonths
  );
  const discountCode = session.metadata?.discountCode || void 0;
  if (!userId || ![3, 6, 12].includes(durationMonths)) {
    throwError5("Invalid Stripe payment metadata", 400);
  }
  const paymentSession = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id
  });
  if (paymentSession?.status === "paid") {
    return User.findById(paymentSession.user);
  }
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throwError5("User not found", 404);
  }
  const now = /* @__PURE__ */ new Date();
  const expiresAt = addMonths(now, durationMonths);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const accountStatus = existingUser.approvalStatus === "approved" ? "active" : "pending_approval";
  const updatePayload = {
    paymentStatus: "paid",
    subscriptionStatus: "active",
    accountStatus,
    subscriptionStartAt: now,
    subscriptionExpiresAt: expiresAt,
    stripeCheckoutSessionId: session.id
  };
  if (customerId) {
    updatePayload.stripeCustomerId = customerId;
  }
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: updatePayload
    },
    {
      new: true,
      runValidators: true
    }
  );
  await PaymentSession.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id
    },
    {
      $set: {
        status: "paid",
        amountTotal: session.amount_total ?? void 0,
        currency: session.currency ?? "usd"
      }
    }
  );
  await RegistrationPaymentLink.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id
    },
    {
      $set: {
        status: "paid",
        paidAt: /* @__PURE__ */ new Date()
      }
    }
  );
  if (discountCode) {
    try {
      await discountService.redeemDiscountCodeAfterPayment({
        code: discountCode,
        userId,
        role: existingUser.role,
        accessTo: existingUser.accessTo,
        stripeCheckoutSessionId: session.id
      });
    } catch (error) {
      console.error(
        `[DISCOUNT REDEEM FAILED] session=${session.id} code=${discountCode} userId=${userId}:`,
        error
      );
    }
  }
  return user;
};
var activateUpgradePayment = async (session) => {
  const userId = session.metadata?.userId;
  const durationMonths = Number(
    session.metadata?.durationMonths
  );
  const discountCode = session.metadata?.discountCode || void 0;
  if (!userId) {
    throwError5("User ID missing from payment metadata.", 400);
  }
  if (![3, 6, 12].includes(durationMonths)) {
    throwError5("Invalid membership duration.", 400);
  }
  const existingPayment = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id
  });
  if (existingPayment?.status === "paid") {
    return User.findById(userId);
  }
  const user = await User.findById(userId);
  assertFound_default(user, "User not found.", 404);
  const now = /* @__PURE__ */ new Date();
  const expiresAt = addMonths(now, durationMonths);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const updatePayload = {
    membershipDurationMonths: durationMonths,
    membershipAccessStatus: "active",
    paymentStatus: "paid",
    subscriptionStatus: "active",
    subscriptionStartAt: now,
    subscriptionExpiresAt: expiresAt
  };
  if (customerId) {
    updatePayload.stripeCustomerId = customerId;
  }
  await User.findByIdAndUpdate(
    userId,
    {
      $set: updatePayload
    },
    {
      new: true,
      runValidators: true
    }
  );
  await PaymentSession.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id
    },
    {
      $set: {
        status: "paid",
        amountTotal: session.amount_total ?? void 0,
        currency: session.currency ?? "usd"
      }
    }
  );
  if (discountCode) {
    try {
      await discountService.redeemDiscountCodeAfterPayment({
        code: discountCode,
        userId,
        role: user.role,
        accessTo: user.accessTo,
        stripeCheckoutSessionId: session.id
      });
    } catch (error) {
      console.error(
        `[DISCOUNT REDEEM FAILED] session=${session.id} code=${discountCode} userId=${userId}:`,
        error
      );
    }
  }
  return User.findById(userId);
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
  const stripeClient = getStripeClient2();
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
    throwError5("Stripe signature is missing", 400);
  }
  const webhookSecret = config_default.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throwError5("Stripe webhook secret is missing", 500);
  }
  const stripeClient = getStripeClient2();
  let webhookEvent;
  try {
    webhookEvent = stripeClient.webhooks.constructEvent(
      rawBody,
      stripeSignatureValue,
      webhookSecret
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error instanceof Error ? error.message : error
    );
    return throwError5("Invalid Stripe webhook signature", 400);
  }
  switch (webhookEvent.type) {
    case "checkout.session.completed": {
      const session = webhookEvent.data.object;
      if (session.payment_status !== "paid") {
        console.log(
          `Stripe checkout ${session.id} completed but payment status is ${session.payment_status}`
        );
        break;
      }
      const purpose = session.metadata?.purpose;
      if (!purpose) {
        console.error(
          `Stripe checkout ${session.id} has no payment purpose in metadata`
        );
        break;
      }
      if (purpose === "invictus_purchase") {
        await invictusPaymentService.activateInvictusPurchase(session);
        break;
      }
      if (purpose === "registration") {
        await activateRegistrationPayment(session);
        break;
      }
      if (purpose === "upgrade") {
        await activateUpgradePayment(session);
        break;
      }
      console.warn(
        `Unknown Stripe checkout purpose "${purpose}" for session ${session.id}`
      );
      break;
    }
    case "invoice.paid":
      await handleInvoicePaid(webhookEvent.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(
        webhookEvent.data.object
      );
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeletedOrExpired(
        webhookEvent.data.object
      );
      break;
    default: {
      console.log(`Unhandled Stripe webhook event: ${webhookEvent.type}`);
      break;
    }
  }
};
var verifyCheckoutSessionFromStripe = async (sessionId) => {
  const stripeClient = getStripeClient2();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return { paid: false, message: "Payment is not completed yet" };
  }
  const purpose = session.metadata?.purpose;
  if (purpose === "upgrade") {
    await activateUpgradePayment(session);
  } else {
    await activateRegistrationPayment(session);
  }
  return { paid: true, message: "Payment verified successfully" };
};
var getMyUpgradePlans = async (userId) => {
  await syncMembershipExpiry(userId);
  const user = await User.findById(userId).select(
    "role accessTo membershipAccessStatus subscriptionExpiresAt"
  );
  if (!user) {
    throwError5("User not found", 404);
  }
  assertFound_default(user, "User not found", 404);
  if (user.membershipAccessStatus !== "expired") {
    throwError5(
      "Upgrade plans are only available after membership expiry.",
      400
    );
  }
  const durations = user.role === "ceo" || user.role === "ceo_partner" ? [12] : [3, 6, 12];
  const plans = durations.map((durationMonths) => ({
    durationMonths,
    pricing: getPricingByRoleAndAccess(
      user.role,
      user.accessTo,
      durationMonths
    )
  }));
  return {
    role: user.role,
    accessTo: user.accessTo,
    membershipAccessStatus: user.membershipAccessStatus,
    expiredAt: user.subscriptionExpiresAt,
    plans
  };
};
var sendRegistrationPaymentLinkEmail = async (paymentLinkId) => {
  const paymentLink = await RegistrationPaymentLink.findById(
    paymentLinkId
  ).populate({
    path: "user",
    select: "fullName email role"
  });
  if (!paymentLink) {
    throwError5("Payment link not found", 404);
  }
  const currentPaymentLink = paymentLink;
  if (!["active", "checkout_created"].includes(currentPaymentLink.status)) {
    throwError5(
      "This payment link is no longer active (already paid or revoked).",
      400
    );
  }
  const user = currentPaymentLink.user;
  if (!user) {
    throwError5("User not found for this payment link", 404);
  }
  const paymentUrl = `${config_default.FRONTEND_URL}/payment/registration/${currentPaymentLink.token}`;
  await sendRegistrationPaymentLinkMail({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    paymentLink: paymentUrl
  });
  return {
    sent: true,
    email: user.email,
    paymentLink: paymentUrl
  };
};
var paymentService = {
  getAllPricingPlans,
  getPricingPlanByRoleAndAccess,
  createCheckoutSession,
  createUpgradeCheckoutSessionIntoStripe,
  handleStripeWebhook,
  verifyCheckoutSessionFromStripe,
  getMyUpgradePlans,
  getRegistrationPaymentDetails,
  createRegistrationCheckoutByToken,
  getPendingRegistrationPayments,
  sendRegistrationPaymentLinkEmail
};

// src/modules/payment/payment.validation.ts
import { z as z6 } from "zod";
var createUpgradeCheckoutValidation = z6.object({
  body: z6.object({
    durationMonths: z6.union([
      z6.literal(3),
      z6.literal(6),
      z6.literal(12)
    ]),
    discountCode: z6.string().trim().max(50).optional()
  })
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
      validatedData.body.durationMonths,
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
var getRegistrationPaymentDetails2 = async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token) {
      throw new Error(
        "Payment token is required"
      );
    }
    const result = await paymentService.getRegistrationPaymentDetails(
      token
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Registration payment details retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var createRegistrationCheckout = async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token) {
      throw new Error(
        "Payment token is required"
      );
    }
    const result = await paymentService.createRegistrationCheckoutByToken(
      token,
      req.body?.discountCode
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
var getPendingRegistrationPayments2 = async (_req, res, next) => {
  try {
    const result = await paymentService.getPendingRegistrationPayments();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Pending registration payments retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyUpgradePlans2 = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    const result = await paymentService.getMyUpgradePlans(
      userId
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Upgrade plans retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var sendRegistrationPaymentLink = async (req, res, next) => {
  try {
    const linkId = req.params.linkId;
    if (!linkId) {
      throw new Error("Payment link ID is required");
    }
    const result = await paymentService.sendRegistrationPaymentLinkEmail(linkId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment link sent to user successfully",
      data: result
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
  stripeWebhook,
  getMyUpgradePlans: getMyUpgradePlans2,
  getRegistrationPaymentDetails: getRegistrationPaymentDetails2,
  createRegistrationCheckout,
  getPendingRegistrationPayments: getPendingRegistrationPayments2,
  sendRegistrationPaymentLink
};

// src/modules/payment/payment.route.ts
var router8 = Router8();
router8.get("/pricing", paymentController.getAllPricingPlans);
router8.get("/pricing/:role/:accessTo", paymentController.getPricingPlanByRoleAndAccess);
router8.post(
  "/upgrade",
  verifyToken,
  paymentController.createUpgradeCheckout
);
router8.get(
  "/verify-session/:sessionId",
  paymentController.verifyCheckoutSession
);
router8.get(
  "/registration-link/:token",
  paymentController.getRegistrationPaymentDetails
);
router8.post(
  "/registration-link/:token/checkout",
  paymentController.createRegistrationCheckout
);
router8.get(
  "/registration-pending",
  verifyToken,
  authorizeRoles(
    "founder"
  ),
  paymentController.getPendingRegistrationPayments
);
router8.get(
  "/upgrade/plans",
  verifyToken,
  paymentController.getMyUpgradePlans
);
router8.post(
  "/registration-link/:linkId/send",
  verifyToken,
  authorizeRoles("founder"),
  paymentController.sendRegistrationPaymentLink
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
var ensureUserExists3 = (user) => {
  if (user == null) {
    throwError6("User not found", 404);
  }
  return user;
};
var formatProfileResponse = (user) => {
  return {
    ...user,
    profileImage: user.profileImage
    //  || getDefaultProfileImage()
  };
};
var getMyProfileFromDB = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) {
    throwError6("User not found", 404);
  }
  const safeUser = ensureUserExists3(user);
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
  const safeUpdatedUser = ensureUserExists3(updatedUser);
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
  const safeUpdatedUser = ensureUserExists3(updatedUser);
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
  const safeUpdatedUser = ensureUserExists3(updatedUser);
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
  const safeUpdatedUser = ensureUserExists3(updatedUser);
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
  const safeUpdatedUser = ensureUserExists3(updatedUser);
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
  const safeUpdatedUser = ensureUserExists3(updatedUser);
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
  const safeUpdatedUser = ensureUserExists3(updatedUser);
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
router9.use(verifyToken);
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
    ]).optional(),
    accessTo: z8.enum(["we_command_center", "invictus", "both"]).optional()
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
var deleteDiscountCode = async (req, res, next) => {
  try {
    const id3 = req.params.id;
    if (!id3) {
      throw new Error("Discount code ID is required");
    }
    const result = await discountService.deleteDiscountCodeFromDB(id3);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Discount code deleted successfully",
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
  sendDiscountCodeEmail,
  deleteDiscountCode
};

// src/modules/discount/discount.route.ts
var router10 = Router10();
router10.get("/validate", discountController.validateDiscountCode);
router10.use(verifyToken);
router10.use(authorizeRoles("founder", "manager"));
router10.post("/", discountController.createDiscountCode);
router10.get("/", discountController.getAllDiscountCodes);
router10.post("/send-email", discountController.sendDiscountCodeEmail);
router10.delete("/:id", discountController.deleteDiscountCode);
var discountRoutes = router10;

// src/modules/promoters/promoters.routes.ts
import { Router as Router11 } from "express";

// src/utility/escaperegax.ts
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/modules/promoters/promoters.services.ts
var getPromotersFromDB = async (query) => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query
  };
  let baseQuery = Promoter.find().populate("user");
  const searchTerm = query.search?.trim();
  if (searchTerm) {
    const matchingUserIds = await User.find({
      fullName: { $regex: escapeRegex(searchTerm), $options: "i" }
    }).distinct("_id");
    baseQuery = baseQuery.find({ user: { $in: matchingUserIds } });
  }
  const listingQuery = new queryBuilder_default(baseQuery, queryWithDefaultSort).filter().sort().paginate().fieldsLimit();
  const data = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();
  const result = {
    data,
    meta
  };
  return result;
};
var incrementPromoterViewCountInDB = async (id3) => {
  const profile = await Promoter.findByIdAndUpdate(
    id3,
    { $inc: { profile_views: 1 } },
    { new: true, select: "profile_views" }
  );
  if (!profile) {
    throw new NotFoundError("Listing not found");
  }
  return profile;
};
var promotersServices = {
  getPromotersFromDB,
  incrementPromoterViewCountInDB
};

// src/modules/promoters/promoters.controller.ts
var getPromoters = async (req, res, next) => {
  try {
    const query = req.query;
    const results = await promotersServices.getPromotersFromDB(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: false,
      message: "Promoters data retrived successfully",
      data: results
    });
  } catch (error) {
    next(error);
  }
};
var incrementPromoterView = async (req, res, next) => {
  try {
    const { id: id3 } = req.params;
    const result = await promotersServices.incrementPromoterViewCountInDB(
      id3
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "View recorded",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var promotersController = {
  getPromoters,
  incrementPromoterView
};

// src/modules/promoters/promoters.routes.ts
var router11 = Router11();
router11.get("/", promotersController.getPromoters);
router11.patch("/:id/view", promotersController.incrementPromoterView);
var promoterRoutes = router11;

// src/modules/dashboardAnalytics/dashboard.analytics.route.ts
import { Router as Router12 } from "express";

// src/modules/dashboardAnalytics/dashboard.analytics.services.ts
import { Types as Types17 } from "mongoose";
var FULL_ANALYTICS_ACCESS_ROLES = [
  "manager",
  "founder"
  // পরে প্রয়োজন হলে:
  // "admin",
  // "super_admin",
];
var hasFullAnalyticsAccess = (role) => FULL_ANALYTICS_ACCESS_ROLES.includes(role);
var isAdminOrManager4 = (role) => role === "manager" || role === "founder";
var getDashboardStats = async (userId, role) => {
  const ownerId = new Types17.ObjectId(userId);
  const isPrivileged = isAdminOrManager4(role);
  const listingMatch = isPrivileged ? {} : { associate_id: ownerId };
  const commissionMatch = {
    status: "pending",
    ...isPrivileged ? {} : { listing_owner_id: ownerId }
  };
  const promoterListingsMatch = isPrivileged ? {} : { user_id: ownerId };
  const [
    listingStats,
    totalPromotersPlatformWide,
    distinctPromotersOfMyListings,
    propertiesShared,
    commissionStats
  ] = await Promise.all([
    Listing.aggregate([
      { $match: listingMatch },
      {
        $group: {
          _id: null,
          total_listings: { $sum: 1 },
          listing_value: { $sum: "$price.amount" },
          listing_views: { $sum: "$listings_view" }
        }
      }
    ]),
    Promoter.countDocuments(),
    Listing.distinct("promoters.user_id", listingMatch),
    Promoter.aggregate([
      { $match: promoterListingsMatch },
      {
        $group: {
          _id: null,
          total: { $sum: { $size: "$listings" } }
        }
      }
    ]),
    CommissionLedger.aggregate([
      { $match: commissionMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$estimated_commission_amount" }
        }
      }
    ])
  ]);
  return {
    total_listings: listingStats[0]?.total_listings ?? 0,
    listing_value: listingStats[0]?.listing_value ?? 0,
    listing_views: listingStats[0]?.listing_views ?? 0,
    total_promoters: isPrivileged ? totalPromotersPlatformWide : distinctPromotersOfMyListings.length,
    properties_shared_with_me: propertiesShared[0]?.total ?? 0,
    commission_pipeline: commissionStats[0]?.total ?? 0,
    top_promoters: []
  };
};
var getTopPromoters = async () => {
  return Listing.aggregate([
    {
      $group: {
        _id: "$associate_id",
        totalViews: {
          $sum: "$listings_view"
        }
      }
    },
    {
      $sort: {
        totalViews: -1
      }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $project: {
        _id: 0,
        user_id: "$user._id",
        fullName: "$user.fullName",
        profileImage: "$user.profileImage",
        city: "$user.city",
        country: "$user.country",
        totalViews: 1
      }
    }
  ]);
};
var getListingsViewsAnalytics = async (userId, role) => {
  const ownerId = new Types17.ObjectId(userId);
  const canViewAllAnalytics = hasFullAnalyticsAccess(role);
  const listingMatch = canViewAllAnalytics ? {} : {
    associate_id: ownerId
  };
  const listingIds = canViewAllAnalytics ? [] : await Listing.distinct("_id", listingMatch);
  const viewStatsMatch = canViewAllAnalytics ? {} : {
    listing: {
      $in: listingIds
    }
  };
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const totalViewsResult = await Listing.aggregate([
    {
      $match: listingMatch
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $ifNull: ["$listings_view", 0]
          }
        }
      }
    }
  ]);
  const totalViews = totalViewsResult[0]?.total ?? 0;
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const daily = [];
  const weekly = [];
  const monthly = [];
  const dailyResult = await ListingViewStats.aggregate([
    {
      $match: {
        ...viewStatsMatch,
        date: {
          $gte: sevenDaysAgo,
          $lte: endOfToday
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$date"
          }
        },
        value: {
          $sum: {
            $ifNull: ["$views", 0]
          }
        }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + i);
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
    const found = dailyResult.find((item) => item._id === dateKey);
    daily.push({
      label: date.toLocaleDateString("en-US", {
        weekday: "short"
      }),
      value: found?.value ?? 0
    });
  }
  for (let week = 3; week >= 0; week--) {
    const start = new Date(today);
    start.setDate(today.getDate() - week * 7 - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() - week * 7);
    end.setHours(23, 59, 59, 999);
    const result = await ListingViewStats.aggregate([
      {
        $match: {
          ...viewStatsMatch,
          date: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ["$views", 0]
            }
          }
        }
      }
    ]);
    weekly.push({
      label: `Week ${4 - week}`,
      value: result[0]?.total ?? 0
    });
  }
  for (let i = 5; i >= 0; i--) {
    const start = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );
    start.setHours(0, 0, 0, 0);
    const end = new Date(
      today.getFullYear(),
      today.getMonth() - i + 1,
      0
    );
    end.setHours(23, 59, 59, 999);
    const result = await ListingViewStats.aggregate([
      {
        $match: {
          ...viewStatsMatch,
          date: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ["$views", 0]
            }
          }
        }
      }
    ]);
    monthly.push({
      label: start.toLocaleDateString("en-US", {
        month: "short"
      }),
      value: result[0]?.total ?? 0
    });
  }
  const average = daily.length > 0 ? daily.reduce((sum, item) => sum + item.value, 0) / daily.length : 0;
  let growth = 0;
  const firstDay = daily[0];
  const lastDay = daily[daily.length - 1];
  if (firstDay && lastDay && firstDay.value > 0) {
    growth = (lastDay.value - firstDay.value) / firstDay.value * 100;
  }
  return {
    totalViews,
    daily,
    weekly,
    monthly,
    average: Math.round(average),
    growth: Number(growth.toFixed(2))
  };
};
var dashboardService = {
  getDashboardStats,
  getTopPromoters,
  getListingsViewsAnalytics
};

// src/modules/dashboardAnalytics/dashboard.analytics.controller.ts
var getDashboardStats2 = async (req, res, next) => {
  try {
    const result = await dashboardService.getDashboardStats(
      req.user?.id,
      req.user?.role
    );
    sendResponse_default(res, {
      success: true,
      statusCode: 200,
      message: "Dashboard statistics retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getTopPromoters2 = async (req, res, next) => {
  try {
    const result = await dashboardService.getTopPromoters();
    sendResponse_default(res, {
      success: true,
      statusCode: 200,
      message: "Top promoters retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getListingsViewsAnaliticsController = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      throw new Error("User not authenticated");
    }
    const userId = user.id;
    const role = user.role;
    const result = await dashboardService.getListingsViewsAnalytics(
      userId,
      role
    );
    sendResponse_default(res, {
      success: true,
      statusCode: 200,
      message: "Listings views analitics generatred sucessfully retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var dashboardController = {
  getDashboardStats: getDashboardStats2,
  getTopPromoters: getTopPromoters2,
  getListingsViewsAnaliticsController
};

// src/modules/dashboardAnalytics/dashboard.analytics.route.ts
var router12 = Router12();
router12.get("/stats", verifyToken, dashboardController.getDashboardStats);
router12.get(
  "/top-promoters",
  verifyToken,
  dashboardController.getTopPromoters
);
router12.get(
  "/listing-analytics",
  verifyToken,
  dashboardController.getListingsViewsAnaliticsController
);
var dashboardAnalyticsRoutes = router12;

// src/modules/challengePillars/challenge.pillar.route.ts
import { Router as Router13 } from "express";

// src/middleware/invictusAccessMiddleware.ts
var requireInvictusAccess = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          "Authentication required"
        )
      );
    }
    const userId = req.user.id;
    if (!userId) {
      return next(
        new UnauthorizedError(
          "Authenticated user ID is missing"
        )
      );
    }
    if (req.user.role === "admin" || req.user.role === "manager") {
      return next();
    }
    const user = await User.findById(userId).select(
      [
        "_id",
        "email",
        "role",
        "accessTo",
        "approvalStatus",
        "accountStatus",
        "paymentStatus",
        "subscriptionStatus",
        "subscriptionStartAt",
        "subscriptionExpiresAt"
      ].join(" ")
    ).lean();
    if (!user) {
      return next(
        new UnauthorizedError(
          "User account not found"
        )
      );
    }
    const hasInvictusAccess = user.accessTo === "invictus" || user.accessTo === "both";
    if (!hasInvictusAccess) {
      return next(
        new ForbiddenError(
          "Your membership does not include INVICTUS Academy access"
        )
      );
    }
    if (user.approvalStatus === "pending") {
      return next(
        new ForbiddenError(
          "Your account is waiting for admin approval"
        )
      );
    }
    if (user.approvalStatus === "rejected") {
      return next(
        new ForbiddenError(
          "Your account approval has been rejected"
        )
      );
    }
    if (user.approvalStatus !== "approved") {
      return next(
        new ForbiddenError(
          "Your account is not approved"
        )
      );
    }
    if (user.accountStatus === "pending_payment") {
      return next(
        new ForbiddenError(
          "Please complete your membership payment first"
        )
      );
    }
    if (user.accountStatus === "pending_approval") {
      return next(
        new ForbiddenError(
          "Your account is waiting for admin approval"
        )
      );
    }
    if (user.accountStatus === "suspended") {
      return next(
        new ForbiddenError(
          "Your account has been suspended"
        )
      );
    }
    if (user.accountStatus === "rejected") {
      return next(
        new ForbiddenError(
          "Your account has been rejected"
        )
      );
    }
    if (user.accountStatus !== "active") {
      return next(
        new ForbiddenError(
          "Your account is not active"
        )
      );
    }
    if (user.subscriptionStatus !== "active") {
      return next(
        new ForbiddenError(
          "Your INVICTUS membership subscription is not active"
        )
      );
    }
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) <= /* @__PURE__ */ new Date()) {
      return next(
        new ForbiddenError(
          "Your INVICTUS membership subscription has expired"
        )
      );
    }
    req.user = {
      ...req.user,
      id: String(user._id),
      email: user.email,
      role: user.role,
      accessTo: user.accessTo
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
var invictusAccessMiddleware_default = requireInvictusAccess;

// src/modules/challengePillars/challenge.pillar.service.ts
import { Types as Types18 } from "mongoose";
var throwServiceError6 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
function assertPillarExists(pillar, message = "Challenge pillar not found") {
  if (!pillar) {
    throwServiceError6(message, 404);
  }
}
var isAdminOrManager5 = (role) => {
  return role === "admin" || role === "manager";
};
var validatePaymentConfiguration = ({
  isPaid,
  priceCents,
  stripePriceId
}) => {
  if (isPaid && priceCents <= 0 && !stripePriceId) {
    throwServiceError6(
      "Paid pillar requires priceCents or Stripe Price ID",
      400
    );
  }
  if (!isPaid && priceCents > 0) {
    throwServiceError6("Free pillar price must be zero", 400);
  }
  if (!isPaid && stripePriceId) {
    throwServiceError6("Free pillar cannot have Stripe Price ID", 400);
  }
};
var createChallengePillar = async (payload, actorId) => {
  const existingPillar = await ChallengePillar.findOne({
    $or: [
      { name: payload.name },
      { slug: payload.slug },
      { order: payload.order }
    ]
  });
  if (existingPillar) {
    throwServiceError6("Challenge pillar already exists", 409);
  }
  const isPaid = payload.isPaid ?? false;
  const priceCents = payload.priceCents ?? 0;
  validatePaymentConfiguration({
    isPaid,
    priceCents,
    stripePriceId: payload.stripePriceId
  });
  const pillar = await ChallengePillar.create({
    ...payload,
    accentColor: payload.accentColor ?? "#C9A84C",
    isPaid,
    priceCents,
    currency: payload.currency ?? "usd",
    introVideo: {
      status: "not_uploaded",
      ...payload.introVideo
    },
    status: "draft",
    createdBy: new Types18.ObjectId(actorId)
  });
  return pillar;
};
var seedDefaultChallengePillars = async (actorId) => {
  const createdBy = new Types18.ObjectId(actorId);
  const defaultPillars = [
    {
      name: "FEARLESS",
      slug: "fearless",
      title: "FEARLESS",
      tagline: "Conquer what holds you back.",
      description: "Conquer fear, build confidence and take decisive action.",
      icon: "crown",
      accentColor: "#C9A84C",
      isPaid: false,
      priceCents: 0,
      currency: "usd",
      introVideo: {
        status: "not_uploaded"
      },
      order: 1,
      status: "draft",
      createdBy
    },
    {
      name: "LIMITLESS",
      slug: "limitless",
      title: "LIMITLESS",
      tagline: "Expand beyond every boundary.",
      description: "Expand your capacity, ambition and personal limits.",
      icon: "infinity",
      accentColor: "#C9A84C",
      isPaid: true,
      priceCents: 0,
      currency: "usd",
      introVideo: {
        status: "not_uploaded"
      },
      order: 2,
      status: "draft",
      createdBy
    },
    {
      name: "BORDERLESS",
      slug: "borderless",
      title: "BORDERLESS",
      tagline: "Build without limits or geography.",
      description: "Build business, opportunities and relationships without geographic limits.",
      icon: "globe",
      accentColor: "#C9A84C",
      isPaid: true,
      priceCents: 0,
      currency: "usd",
      introVideo: {
        status: "not_uploaded"
      },
      order: 3,
      status: "draft",
      createdBy
    }
  ];
  await ChallengePillar.bulkWrite(
    defaultPillars.map((pillar) => ({
      updateOne: {
        filter: {
          slug: pillar.slug
        },
        update: {
          $setOnInsert: pillar
        },
        upsert: true
      }
    }))
  );
  return ChallengePillar.find().sort({ order: 1 }).populate("createdBy", "fullName email role profileImage");
};
var getAllChallengePillars = async ({
  actorRole,
  includeArchived = false
}) => {
  const filter = {};
  if (!isAdminOrManager5(actorRole)) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived"
    };
  }
  return ChallengePillar.find(filter).sort({ order: 1 }).populate("createdBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
};
var getChallengePillarBySlug = async (slug, actorRole) => {
  const filter = {
    slug
  };
  if (!isAdminOrManager5(actorRole)) {
    filter.status = "published";
  }
  const pillar = await ChallengePillar.findOne(filter).populate("createdBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
  assertPillarExists(pillar);
  return pillar;
};
var updateChallengePillar = async (pillarId, payload, actorId) => {
  const pillar = await ChallengePillar.findById(pillarId);
  assertPillarExists(pillar);
  if (pillar.status === "archived") {
    throwServiceError6("Archived pillar cannot be updated", 400);
  }
  const nextIsPaid = payload.isPaid ?? pillar.isPaid;
  let nextPriceCents = payload.priceCents ?? pillar.priceCents;
  let nextStripePriceId = payload.stripePriceId === null ? void 0 : payload.stripePriceId ?? pillar.stripePriceId;
  if (!nextIsPaid) {
    nextPriceCents = 0;
    nextStripePriceId = void 0;
  }
  validatePaymentConfiguration({
    isPaid: nextIsPaid,
    priceCents: nextPriceCents,
    stripePriceId: nextStripePriceId
  });
  if (payload.title !== void 0) {
    pillar.title = payload.title;
  }
  if (payload.tagline !== void 0) {
    pillar.tagline = payload.tagline;
  }
  if (payload.description !== void 0) {
    pillar.description = payload.description;
  }
  if (payload.accentColor !== void 0) {
    pillar.accentColor = payload.accentColor;
  }
  pillar.isPaid = nextIsPaid;
  pillar.priceCents = nextPriceCents;
  pillar.currency = payload.currency ?? pillar.currency;
  pillar.stripePriceId = nextStripePriceId;
  if (payload.introVideo !== void 0) {
    pillar.set("introVideo", {
      ...pillar.introVideo?.toObject?.() ?? pillar.introVideo,
      ...payload.introVideo
    });
  }
  pillar.updatedBy = new Types18.ObjectId(actorId);
  await pillar.save();
  return pillar.populate("updatedBy", "fullName email role profileImage");
};
var publishChallengePillar = async (pillarId, actorId) => {
  const pillar = await ChallengePillar.findById(pillarId);
  assertPillarExists(pillar);
  if (pillar.status === "archived") {
    throwServiceError6("Archived pillar cannot be published", 400);
  }
  validatePaymentConfiguration({
    isPaid: pillar.isPaid,
    priceCents: pillar.priceCents,
    stripePriceId: pillar.stripePriceId
  });
  pillar.status = "published";
  pillar.publishedAt = /* @__PURE__ */ new Date();
  pillar.archivedAt = void 0;
  pillar.updatedBy = new Types18.ObjectId(actorId);
  await pillar.save();
  return pillar;
};
var moveChallengePillarToDraft = async (pillarId, actorId) => {
  const pillar = await ChallengePillar.findById(pillarId);
  assertPillarExists(pillar);
  if (pillar.status === "archived") {
    throwServiceError6("Archived pillar cannot be moved to draft", 400);
  }
  pillar.status = "draft";
  pillar.publishedAt = void 0;
  pillar.updatedBy = new Types18.ObjectId(actorId);
  await pillar.save();
  return pillar;
};
var archiveChallengePillar = async (pillarId, actorId) => {
  const pillar = await ChallengePillar.findById(pillarId);
  assertPillarExists(pillar);
  pillar.status = "archived";
  pillar.archivedAt = /* @__PURE__ */ new Date();
  pillar.publishedAt = void 0;
  pillar.updatedBy = new Types18.ObjectId(actorId);
  await pillar.save();
  return pillar;
};
var challengePillarService = {
  createChallengePillar,
  seedDefaultChallengePillars,
  getAllChallengePillars,
  getChallengePillarBySlug,
  updateChallengePillar,
  publishChallengePillar,
  moveChallengePillarToDraft,
  archiveChallengePillar
};

// src/modules/challengePillars/challenge.pillar.controller.ts
var getAuthUser3 = (req) => {
  if (!req.user) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }
  const authUser = req.user;
  const userId = authUser.id || authUser.userId;
  if (!userId) {
    const error = new Error("Authenticated user ID is missing");
    error.statusCode = 401;
    throw error;
  }
  return {
    id: String(userId),
    role: String(authUser.role)
  };
};
var createChallengePillar2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.createChallengePillar(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Challenge pillar created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var seedDefaultChallengePillars2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.seedDefaultChallengePillars(
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Default challenge pillars initialized successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllChallengePillars2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.getAllChallengePillars({
      actorRole: authUser.role,
      includeArchived: req.query.includeArchived === "true"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillars retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getChallengePillarBySlug2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.getChallengePillarBySlug(
      req.params.slug,
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateChallengePillar2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.updateChallengePillar(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var publishChallengePillar2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.publishChallengePillar(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar published successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moveChallengePillarToDraft2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.moveChallengePillarToDraft(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar moved to draft successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var archiveChallengePillar2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser3(req);
    const result = await challengePillarService.archiveChallengePillar(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar archived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var challengePillarController = {
  createChallengePillar: createChallengePillar2,
  seedDefaultChallengePillars: seedDefaultChallengePillars2,
  getAllChallengePillars: getAllChallengePillars2,
  getChallengePillarBySlug: getChallengePillarBySlug2,
  updateChallengePillar: updateChallengePillar2,
  publishChallengePillar: publishChallengePillar2,
  moveChallengePillarToDraft: moveChallengePillarToDraft2,
  archiveChallengePillar: archiveChallengePillar2
};

// src/modules/challengePillars/challenge.pillar.validation.ts
import { z as z9 } from "zod";
var mongoObjectIdSchema = z9.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var accentColorSchema = z9.string().regex(/^#[0-9A-Fa-f]{6}$/, "Accent color must be a valid HEX color");
var introVideoSchema = z9.object({
  cloudinaryPublicId: z9.string().trim().min(1).optional(),
  cloudinaryAssetId: z9.string().trim().min(1).optional(),
  secureUrl: z9.string().url().optional(),
  playbackUrl: z9.string().url().optional(),
  thumbnailUrl: z9.string().url().optional(),
  durationSeconds: z9.number().nonnegative().optional(),
  format: z9.string().trim().optional(),
  bytes: z9.number().int().nonnegative().optional(),
  status: z9.enum(INTRO_VIDEO_STATUSES).optional()
});
var createChallengePillarBodySchema = z9.object({
  name: z9.enum(PILLAR_NAMES),
  slug: z9.enum(PILLAR_SLUGS),
  title: z9.string().trim().min(2).max(150),
  tagline: z9.string().trim().min(2).max(250),
  description: z9.string().trim().min(10).max(3e3),
  icon: z9.enum(PILLAR_ICONS),
  accentColor: accentColorSchema.default("#C9A84C"),
  isPaid: z9.boolean().default(false),
  priceCents: z9.number().int().nonnegative().default(0),
  currency: z9.literal("usd").default("usd"),
  stripePriceId: z9.string().trim().min(3).optional(),
  introVideo: introVideoSchema.optional(),
  order: z9.number().int().min(1).max(3)
}).superRefine((data, context) => {
  const pillarRules = {
    fearless: {
      name: "FEARLESS",
      icon: "crown",
      order: 1
    },
    limitless: {
      name: "LIMITLESS",
      icon: "infinity",
      order: 2
    },
    borderless: {
      name: "BORDERLESS",
      icon: "globe",
      order: 3
    }
  };
  const expected = pillarRules[data.slug];
  if (data.name !== expected.name) {
    context.addIssue({
      code: z9.ZodIssueCode.custom,
      path: ["name"],
      message: `${data.slug} name must be ${expected.name}`
    });
  }
  if (data.icon !== expected.icon) {
    context.addIssue({
      code: z9.ZodIssueCode.custom,
      path: ["icon"],
      message: `${data.slug} icon must be ${expected.icon}`
    });
  }
  if (data.order !== expected.order) {
    context.addIssue({
      code: z9.ZodIssueCode.custom,
      path: ["order"],
      message: `${data.slug} order must be ${expected.order}`
    });
  }
  if (data.isPaid && data.priceCents <= 0 && !data.stripePriceId) {
    context.addIssue({
      code: z9.ZodIssueCode.custom,
      path: ["priceCents"],
      message: "Paid pillar requires priceCents or stripePriceId"
    });
  }
  if (!data.isPaid && data.priceCents > 0) {
    context.addIssue({
      code: z9.ZodIssueCode.custom,
      path: ["priceCents"],
      message: "Free pillar price must be zero"
    });
  }
  if (!data.isPaid && data.stripePriceId) {
    context.addIssue({
      code: z9.ZodIssueCode.custom,
      path: ["stripePriceId"],
      message: "Free pillar cannot have Stripe Price ID"
    });
  }
});
var updateChallengePillarBodySchema = z9.object({
  title: z9.string().trim().min(2).max(150).optional(),
  tagline: z9.string().trim().min(2).max(250).optional(),
  description: z9.string().trim().min(10).max(3e3).optional(),
  accentColor: accentColorSchema.optional(),
  isPaid: z9.boolean().optional(),
  priceCents: z9.number().int().nonnegative().optional(),
  currency: z9.literal("usd").optional(),
  stripePriceId: z9.string().trim().min(3).nullable().optional(),
  introVideo: introVideoSchema.optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required"
});
var createChallengePillarValidation = z9.object({
  body: createChallengePillarBodySchema
});
var updateChallengePillarValidation = z9.object({
  params: z9.object({
    id: mongoObjectIdSchema
  }),
  body: updateChallengePillarBodySchema
});
var challengePillarIdValidation = z9.object({
  params: z9.object({
    id: mongoObjectIdSchema
  })
});
var challengePillarSlugValidation = z9.object({
  params: z9.object({
    slug: z9.enum(PILLAR_SLUGS)
  })
});

// src/modules/challengePillars/challenge.pillar.route.ts
var router13 = Router13();
router13.post(
  "/seed-defaults",
  verifyToken,
  authorizeRoles("admin", "manager"),
  challengePillarController.seedDefaultChallengePillars
);
router13.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(createChallengePillarValidation),
  challengePillarController.createChallengePillar
);
router13.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  challengePillarController.getAllChallengePillars
);
router13.get(
  "/:slug",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(challengePillarSlugValidation),
  challengePillarController.getChallengePillarBySlug
);
router13.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(updateChallengePillarValidation),
  challengePillarController.updateChallengePillar
);
router13.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(challengePillarIdValidation),
  challengePillarController.publishChallengePillar
);
router13.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(challengePillarIdValidation),
  challengePillarController.moveChallengePillarToDraft
);
router13.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(challengePillarIdValidation),
  challengePillarController.archiveChallengePillar
);
var challengePillarRoutes = router13;

// src/modules/courseModules/course.module.route.ts
import { Router as Router14 } from "express";

// src/modules/courseModules/course.module.service.ts
import { Types as Types19 } from "mongoose";

// src/modules/courseModules/course.module.model.schema.ts
import { Schema as Schema17, model as model17 } from "mongoose";

// src/modules/courseModules/course.module.interface.ts
var COURSE_MODULE_STATUSES = [
  "draft",
  "published",
  "archived"
];

// src/modules/courseModules/course.module.model.schema.ts
var courseModuleSchema = new Schema17(
  {
    pillar: {
      type: Schema17.Types.ObjectId,
      ref: "ChallengePillar",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 200
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 500
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5e3
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    moduleNumber: {
      type: Number,
      required: true,
      min: 1
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumVideoPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    minimumActionPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    minimumQuizScore: {
      type: Number,
      default: 70,
      min: 1,
      max: 100
    },
    maximumQuizAttempts: {
      type: Number,
      default: 2,
      min: 1,
      max: 10
    },
    completionPoints: {
      type: Number,
      default: 20,
      min: 0
    },
    status: {
      type: String,
      enum: COURSE_MODULE_STATUSES,
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    createdBy: {
      type: Schema17.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema17.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "coursemodules"
  }
);
courseModuleSchema.index(
  {
    pillar: 1,
    moduleNumber: 1
  },
  {
    unique: true
  }
);
courseModuleSchema.index(
  {
    pillar: 1,
    slug: 1
  },
  {
    unique: true
  }
);
courseModuleSchema.index({
  pillar: 1,
  status: 1,
  moduleNumber: 1
});
var CourseModule = model17(
  "CourseModule",
  courseModuleSchema
);

// src/modules/courseModules/course.module.service.ts
var throwServiceError7 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
function assertCourseExists(pillar, message = "Challenge pillar not found") {
  if (!pillar) {
    throwServiceError7(message, 404);
  }
}
var isAdminOrManager6 = (role) => {
  return role === "admin" || role === "manager";
};
var createCourseModule = async (payload, actorId) => {
  const pillar = await ChallengePillar.findById(
    payload.pillar
  );
  assertCourseExists(pillar);
  if (!pillar) {
    throwServiceError7(
      "Challenge pillar not found",
      404
    );
  }
  if (pillar.status === "archived") {
    throwServiceError7(
      "Cannot create module under archived pillar",
      400
    );
  }
  const existingModule = await CourseModule.findOne({
    pillar: payload.pillar,
    $or: [
      {
        slug: payload.slug
      },
      {
        moduleNumber: payload.moduleNumber
      }
    ]
  });
  if (existingModule) {
    throwServiceError7(
      "Module slug or module number already exists in this pillar",
      409
    );
  }
  const courseModule = await CourseModule.create({
    ...payload,
    pillar: new Types19.ObjectId(
      payload.pillar
    ),
    estimatedDurationMinutes: payload.estimatedDurationMinutes ?? 0,
    minimumVideoPercent: payload.minimumVideoPercent ?? 80,
    minimumActionPercent: payload.minimumActionPercent ?? 80,
    minimumQuizScore: payload.minimumQuizScore ?? 70,
    maximumQuizAttempts: payload.maximumQuizAttempts ?? 2,
    completionPoints: payload.completionPoints ?? 20,
    status: "draft",
    createdBy: new Types19.ObjectId(actorId)
  });
  return courseModule.populate([
    {
      path: "pillar",
      select: "name slug title isPaid priceCents currency status"
    },
    {
      path: "createdBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var getAllCourseModules = async ({
  actorRole,
  pillarId,
  includeArchived = false
}) => {
  const filter = {};
  if (pillarId) {
    filter.pillar = new Types19.ObjectId(pillarId);
  }
  if (!isAdminOrManager6(actorRole)) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived"
    };
  }
  return CourseModule.find(filter).sort({
    pillar: 1,
    moduleNumber: 1
  }).populate(
    "pillar",
    "name slug title isPaid priceCents currency status"
  ).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
};
var getModulesByPillar = async (pillarId, actorRole) => {
  const pillarFilter = {
    _id: pillarId
  };
  if (!isAdminOrManager6(actorRole)) {
    pillarFilter.status = "published";
  }
  const pillar = await ChallengePillar.findOne(
    pillarFilter
  );
  if (!pillar) {
    throwServiceError7(
      "Challenge pillar not found or unavailable",
      404
    );
  }
  const moduleFilter = {
    pillar: pillarId
  };
  if (!isAdminOrManager6(actorRole)) {
    moduleFilter.status = "published";
  } else {
    moduleFilter.status = {
      $ne: "archived"
    };
  }
  const modules = await CourseModule.find(
    moduleFilter
  ).sort({ moduleNumber: 1 }).populate(
    "pillar",
    "name slug title isPaid priceCents currency status"
  );
  return {
    pillar,
    modules
  };
};
var getSingleCourseModule = async (moduleId, actorRole) => {
  const filter = {
    _id: moduleId
  };
  if (!isAdminOrManager6(actorRole)) {
    filter.status = "published";
  }
  const courseModule = await CourseModule.findOne(filter).populate(
    "pillar",
    "name slug title isPaid priceCents currency status"
  ).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
  if (!courseModule) {
    throwServiceError7(
      "Course module not found",
      404
    );
  }
  return courseModule;
};
var updateCourseModule = async (moduleId, payload, actorId) => {
  const courseModule = await CourseModule.findById(
    moduleId
  );
  assertCourseExists(courseModule);
  if (!courseModule) {
    throwServiceError7(
      "Course module not found",
      404
    );
  }
  if (courseModule?.status === "archived") {
    throwServiceError7(
      "Archived module cannot be updated",
      400
    );
  }
  if (payload.slug !== void 0 || payload.moduleNumber !== void 0) {
    const duplicateConditions = [];
    if (payload.slug !== void 0) {
      duplicateConditions.push({
        slug: payload.slug
      });
    }
    if (payload.moduleNumber !== void 0) {
      duplicateConditions.push({
        moduleNumber: payload.moduleNumber
      });
    }
    const duplicateModule = await CourseModule.findOne({
      _id: {
        $ne: courseModule._id
      },
      pillar: courseModule.pillar,
      $or: duplicateConditions
    });
    if (duplicateModule) {
      throwServiceError7(
        "Module slug or module number already exists in this pillar",
        409
      );
    }
  }
  if (payload.title !== void 0) {
    courseModule.title = payload.title;
  }
  if (payload.slug !== void 0) {
    courseModule.slug = payload.slug;
  }
  if (payload.shortDescription === null) {
    courseModule.shortDescription = void 0;
  } else if (payload.shortDescription !== void 0) {
    courseModule.shortDescription = payload.shortDescription;
  }
  if (payload.description !== void 0) {
    courseModule.description = payload.description;
  }
  if (payload.thumbnailUrl === null) {
    courseModule.thumbnailUrl = void 0;
  } else if (payload.thumbnailUrl !== void 0) {
    courseModule.thumbnailUrl = payload.thumbnailUrl;
  }
  if (payload.moduleNumber !== void 0) {
    courseModule.moduleNumber = payload.moduleNumber;
  }
  if (payload.estimatedDurationMinutes !== void 0) {
    courseModule.estimatedDurationMinutes = payload.estimatedDurationMinutes;
  }
  if (payload.minimumVideoPercent !== void 0) {
    courseModule.minimumVideoPercent = payload.minimumVideoPercent;
  }
  if (payload.minimumActionPercent !== void 0) {
    courseModule.minimumActionPercent = payload.minimumActionPercent;
  }
  if (payload.minimumQuizScore !== void 0) {
    courseModule.minimumQuizScore = payload.minimumQuizScore;
  }
  if (payload.maximumQuizAttempts !== void 0) {
    courseModule.maximumQuizAttempts = payload.maximumQuizAttempts;
  }
  if (payload.completionPoints !== void 0) {
    courseModule.completionPoints = payload.completionPoints;
  }
  courseModule.updatedBy = new Types19.ObjectId(actorId);
  await courseModule.save();
  return courseModule.populate([
    {
      path: "pillar",
      select: "name slug title isPaid priceCents currency status"
    },
    {
      path: "updatedBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var publishCourseModule = async (moduleId, actorId) => {
  const courseModule = await CourseModule.findById(
    moduleId
  );
  assertCourseExists(courseModule);
  if (!courseModule) {
    throwServiceError7(
      "Course module not found",
      404
    );
  }
  if (courseModule.status === "archived") {
    throwServiceError7(
      "Archived module cannot be published",
      400
    );
  }
  const pillar = await ChallengePillar.findById(
    courseModule.pillar
  );
  assertCourseExists(pillar);
  if (!pillar) {
    throwServiceError7(
      "Parent challenge pillar not found",
      404
    );
  }
  if (pillar.status !== "published") {
    throwServiceError7(
      "Publish the parent challenge pillar before publishing this module",
      400
    );
  }
  courseModule.status = "published";
  courseModule.publishedAt = /* @__PURE__ */ new Date();
  courseModule.archivedAt = void 0;
  courseModule.updatedBy = new Types19.ObjectId(actorId);
  await courseModule.save();
  return courseModule;
};
var moveCourseModuleToDraft = async (moduleId, actorId) => {
  const courseModule = await CourseModule.findById(
    moduleId
  );
  assertCourseExists(courseModule);
  if (!courseModule) {
    throwServiceError7(
      "Course module not found",
      404
    );
  }
  if (courseModule.status === "archived") {
    throwServiceError7(
      "Archived module cannot be moved to draft",
      400
    );
  }
  courseModule.status = "draft";
  courseModule.publishedAt = void 0;
  courseModule.updatedBy = new Types19.ObjectId(actorId);
  await courseModule.save();
  return courseModule;
};
var archiveCourseModule = async (moduleId, actorId) => {
  const courseModule = await CourseModule.findById(
    moduleId
  );
  assertCourseExists(courseModule);
  if (!courseModule) {
    throwServiceError7(
      "Course module not found",
      404
    );
  }
  courseModule.status = "archived";
  courseModule.archivedAt = /* @__PURE__ */ new Date();
  courseModule.publishedAt = void 0;
  courseModule.updatedBy = new Types19.ObjectId(actorId);
  await courseModule.save();
  return courseModule;
};
var courseModuleService = {
  createCourseModule,
  getAllCourseModules,
  getModulesByPillar,
  getSingleCourseModule,
  updateCourseModule,
  publishCourseModule,
  moveCourseModuleToDraft,
  archiveCourseModule
};

// src/modules/courseModules/course.module.controller.ts
var getAuthUser4 = (req) => {
  if (!req.user) {
    const error = new Error(
      "Authentication required"
    );
    error.statusCode = 401;
    throw error;
  }
  const authUser = req.user;
  const userId = authUser.id || authUser.userId;
  if (!userId) {
    const error = new Error(
      "Authenticated user ID is missing"
    );
    error.statusCode = 401;
    throw error;
  }
  return {
    id: String(userId),
    role: String(authUser.role)
  };
};
var createCourseModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.createCourseModule(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Course module created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllCourseModules2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.getAllCourseModules({
      actorRole: authUser.role,
      pillarId: typeof req.query.pillarId === "string" ? req.query.pillarId : void 0,
      includeArchived: req.query.includeArchived === "true"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course modules retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getModulesByPillar2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.getModulesByPillar(
      String(req.params.pillarId),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Pillar modules retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleCourseModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.getSingleCourseModule(
      String(req.params.id),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course module retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateCourseModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.updateCourseModule(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course module updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var publishCourseModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.publishCourseModule(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course module published successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moveCourseModuleToDraft2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.moveCourseModuleToDraft(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course module moved to draft successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var archiveCourseModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser4(req);
    const result = await courseModuleService.archiveCourseModule(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course module archived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var courseModuleController = {
  createCourseModule: createCourseModule2,
  getAllCourseModules: getAllCourseModules2,
  getModulesByPillar: getModulesByPillar2,
  getSingleCourseModule: getSingleCourseModule2,
  updateCourseModule: updateCourseModule2,
  publishCourseModule: publishCourseModule2,
  moveCourseModuleToDraft: moveCourseModuleToDraft2,
  archiveCourseModule: archiveCourseModule2
};

// src/modules/courseModules/course.module.validation.ts
import { z as z10 } from "zod";
var mongoObjectIdSchema2 = z10.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid MongoDB ObjectId"
);
var moduleSlugSchema = z10.string().trim().min(2).max(200).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Slug may contain lowercase letters, numbers and hyphens only"
);
var createCourseModuleBodySchema = z10.object({
  pillar: mongoObjectIdSchema2,
  title: z10.string().trim().min(2).max(200),
  slug: moduleSlugSchema,
  shortDescription: z10.string().trim().max(500).optional(),
  description: z10.string().trim().min(10).max(5e3),
  thumbnailUrl: z10.string().url().optional(),
  moduleNumber: z10.number().int().min(1),
  estimatedDurationMinutes: z10.number().int().nonnegative().default(0),
  minimumVideoPercent: z10.number().min(1).max(100).default(80),
  minimumActionPercent: z10.number().min(1).max(100).default(80),
  minimumQuizScore: z10.number().min(1).max(100).default(70),
  maximumQuizAttempts: z10.number().int().min(1).max(10).default(2),
  completionPoints: z10.number().int().nonnegative().default(20)
});
var updateCourseModuleBodySchema = z10.object({
  title: z10.string().trim().min(2).max(200).optional(),
  slug: moduleSlugSchema.optional(),
  shortDescription: z10.string().trim().max(500).nullable().optional(),
  description: z10.string().trim().min(10).max(5e3).optional(),
  thumbnailUrl: z10.string().url().nullable().optional(),
  moduleNumber: z10.number().int().min(1).optional(),
  estimatedDurationMinutes: z10.number().int().nonnegative().optional(),
  minimumVideoPercent: z10.number().min(1).max(100).optional(),
  minimumActionPercent: z10.number().min(1).max(100).optional(),
  minimumQuizScore: z10.number().min(1).max(100).optional(),
  maximumQuizAttempts: z10.number().int().min(1).max(10).optional(),
  completionPoints: z10.number().int().nonnegative().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required"
  }
);
var createCourseModuleValidation = z10.object({
  body: createCourseModuleBodySchema
});
var updateCourseModuleValidation = z10.object({
  params: z10.object({
    id: mongoObjectIdSchema2
  }),
  body: updateCourseModuleBodySchema
});
var courseModuleIdValidation = z10.object({
  params: z10.object({
    id: mongoObjectIdSchema2
  })
});
var courseModulePillarValidation = z10.object({
  params: z10.object({
    pillarId: mongoObjectIdSchema2
  })
});

// src/modules/courseModules/course.module.route.ts
var router14 = Router14();
router14.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(
    createCourseModuleValidation
  ),
  courseModuleController.createCourseModule
);
router14.get(
  "/",
  verifyToken,
  invictusAccessMiddleware_default,
  courseModuleController.getAllCourseModules
);
router14.get(
  "/pillar/:pillarId",
  verifyToken,
  invictusAccessMiddleware_default,
  validateRequest_default(
    courseModulePillarValidation
  ),
  courseModuleController.getModulesByPillar
);
router14.get(
  "/:id",
  verifyToken,
  invictusAccessMiddleware_default,
  validateRequest_default(
    courseModuleIdValidation
  ),
  courseModuleController.getSingleCourseModule
);
router14.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(
    updateCourseModuleValidation
  ),
  courseModuleController.updateCourseModule
);
router14.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(
    courseModuleIdValidation
  ),
  courseModuleController.publishCourseModule
);
router14.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(
    courseModuleIdValidation
  ),
  courseModuleController.moveCourseModuleToDraft
);
router14.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(
    courseModuleIdValidation
  ),
  courseModuleController.archiveCourseModule
);
var courseModuleRoutes = router14;

// src/modules/moduleVideos/module.video.route.ts
import { Router as Router15 } from "express";

// src/middleware/mediaUploadMiddleware.ts
import multer2 from "multer";
var memoryStorage = multer2.memoryStorage();
var allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/mpeg"
];
var allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];
var allowedResourceTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  ...allowedImageTypes
];
var uploadModuleVideo = multer2({
  storage: memoryStorage,
  limits: {
    fileSize: 150 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only MP4, WEBM, MOV, M4V, and MPEG video files are allowed")
      );
    }
    return callback(null, true);
  }
});
var uploadModuleResource = multer2({
  storage: memoryStorage,
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 2
  },
  fileFilter: (_req, file, callback) => {
    if (file.fieldname === "thumbnail") {
      if (!allowedImageTypes.includes(file.mimetype)) {
        return callback(
          new Error("Thumbnail must be JPG, JPEG, PNG, or WEBP")
        );
      }
      return callback(null, true);
    }
    if (file.fieldname === "resource") {
      if (!allowedResourceTypes.includes(file.mimetype)) {
        return callback(
          new Error(
            "Unsupported resource type. Upload PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG, or WEBP"
          )
        );
      }
      return callback(null, true);
    }
    return callback(new Error(`Unexpected upload field: ${file.fieldname}`));
  }
});
var uploadModuleResourceFields = uploadModuleResource.fields([
  { name: "resource", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]);
var parseBoolean = (value) => {
  if (value === true || value === "true") {
    return true;
  }
  if (value === false || value === "false") {
    return false;
  }
  return void 0;
};
var parseNumber = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};
var normalizeModuleVideoMultipartBody = (req, _res, next) => {
  const parsedIsPaid = parseBoolean(
    req.body.isPaid
  );
  const parsedIsRequired = parseBoolean(
    req.body.isRequired
  );
  if (parsedIsPaid !== void 0) {
    req.body.isPaid = parsedIsPaid;
  }
  if (parsedIsRequired !== void 0) {
    req.body.isRequired = parsedIsRequired;
  }
  if (req.body.requiredWatchPercent !== void 0) {
    req.body.requiredWatchPercent = Number(
      req.body.requiredWatchPercent
    );
  }
  if (req.body.pointsReward !== void 0) {
    req.body.pointsReward = Number(
      req.body.pointsReward
    );
  }
  if (req.body.order !== void 0) {
    req.body.order = Number(
      req.body.order
    );
  }
  next();
};
var normalizeModuleResourceMultipartBody = (req, _res, next) => {
  req.body.isRequired = parseBoolean(req.body.isRequired);
  req.body.pointsReward = parseNumber(req.body.pointsReward);
  req.body.order = parseNumber(req.body.order);
  return next();
};
var getUploadedFieldFile = (req, fieldName) => {
  const files = req.files;
  if (!files || Array.isArray(files)) {
    return void 0;
  }
  const fieldFiles = files[fieldName];
  return fieldFiles?.[0];
};

// src/utility/cloudinaryMedia.ts
import { Readable } from "stream";
import {
  v2 as cloudinary2
} from "cloudinary";
cloudinary2.config({
  cloud_name: config_default.CLOUDINARY_CLOUD_NAME,
  api_key: config_default.CLOUDINARY_API_KEY,
  api_secret: config_default.CLOUDINARY_API_SECRET,
  secure: true
});
var uploadBufferToCloudinary = async (file, options2) => {
  if (!file) {
    throw new Error("No file provided for upload");
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary2.uploader.upload_stream(
      options2,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary did not return an upload result"));
          return;
        }
        resolve(result);
      }
    );
    Readable.from(file.buffer).pipe(uploadStream);
  });
};
var buildVideoPlaybackUrl = (publicId) => {
  return cloudinary2.url(publicId, {
    resource_type: "video",
    secure: true,
    transformation: [
      {
        quality: "auto",
        fetch_format: "auto"
      }
    ]
  });
};
var buildVideoThumbnailUrl = (publicId) => {
  return cloudinary2.url(publicId, {
    resource_type: "video",
    secure: true,
    format: "jpg",
    transformation: [
      {
        start_offset: "2",
        width: 1280,
        height: 720,
        crop: "fill",
        gravity: "auto",
        quality: "auto"
      }
    ]
  });
};
var buildPdfThumbnailUrl = (publicId) => {
  return cloudinary2.url(publicId, {
    resource_type: "image",
    secure: true,
    format: "jpg",
    page: 1,
    transformation: [
      {
        width: 1200,
        height: 1600,
        crop: "fit",
        quality: "auto"
      }
    ]
  });
};
var uploadVideoToCloudinary = async (file, folder) => {
  const result = await uploadBufferToCloudinary(file, {
    folder,
    resource_type: "video",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    eager_async: true,
    eager: [
      {
        quality: "auto",
        fetch_format: "auto"
      }
    ]
  });
  const data = {
    cloudinaryPublicId: result.public_id,
    secureUrl: result.secure_url,
    playbackUrl: buildVideoPlaybackUrl(result.public_id),
    thumbnailUrl: buildVideoThumbnailUrl(result.public_id),
    durationSeconds: typeof result.duration === "number" ? result.duration : 0
  };
  if (typeof result.asset_id === "string") {
    data.cloudinaryAssetId = result.asset_id;
  }
  if (typeof result.folder === "string") {
    data.folder = result.folder;
  }
  if (typeof result.format === "string") {
    data.format = result.format;
  }
  if (typeof result.bytes === "number") {
    data.bytes = result.bytes;
  }
  if (typeof result.width === "number") {
    data.width = result.width;
  }
  if (typeof result.height === "number") {
    data.height = result.height;
  }
  return data;
};
var uploadResourceToCloudinary = async (file, folder) => {
  if (!file) {
    throw new Error("No file provided for upload");
  }
  const result = await uploadBufferToCloudinary(file, {
    folder,
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });
  const resourceType = result.resource_type === "raw" || result.resource_type === "video" ? result.resource_type : "image";
  const data = {
    cloudinaryPublicId: result.public_id,
    secureUrl: result.secure_url,
    fileName: file.originalname,
    mimeType: file.mimetype,
    cloudinaryResourceType: resourceType
  };
  if (typeof result.asset_id === "string") {
    data.cloudinaryAssetId = result.asset_id;
  }
  if (typeof result.format === "string") {
    data.format = result.format;
  }
  if (typeof result.bytes === "number") {
    data.bytes = result.bytes;
  }
  if (file.mimetype === "application/pdf" && resourceType === "image") {
    data.thumbnailUrl = buildPdfThumbnailUrl(result.public_id);
  }
  return data;
};
var uploadThumbnailToCloudinary = async (file, folder) => {
  const result = await uploadBufferToCloudinary(file, {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    transformation: [
      {
        width: 1200,
        height: 675,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
        fetch_format: "auto"
      }
    ]
  });
  return result.secure_url;
};

// src/modules/moduleVideos/module.video.service.ts
import { Types as Types20 } from "mongoose";

// src/modules/moduleVideos/module.video.model.schema.ts
import { model as model18, Schema as Schema18 } from "mongoose";

// src/modules/moduleVideos/module.video.interface.ts
var MODULE_VIDEO_STATUSES = [
  "draft",
  "published",
  "archived"
];
var VIDEO_UPLOAD_STATUSES = [
  "processing",
  "ready",
  "failed"
];

// src/modules/moduleVideos/module.video.model.schema.ts
var moduleVideoSchema = new Schema18(
  {
    module: {
      type: Schema18.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3e3
    },
    provider: {
      type: String,
      enum: ["cloudinary"],
      default: "cloudinary",
      required: true
    },
    resourceType: {
      type: String,
      enum: ["video"],
      default: "video",
      required: true
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      trim: true
    },
    cloudinaryAssetId: {
      type: String,
      trim: true
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true
    },
    playbackUrl: {
      type: String,
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    folder: {
      type: String,
      trim: true
    },
    format: {
      type: String,
      trim: true
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 0
    },
    bytes: {
      type: Number,
      min: 0
    },
    width: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
      index: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    requiredWatchPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    pointsReward: {
      type: Number,
      default: 10,
      min: 0
    },
    order: {
      type: Number,
      required: true,
      min: 1
    },
    uploadStatus: {
      type: String,
      enum: VIDEO_UPLOAD_STATUSES,
      default: "ready",
      index: true
    },
    status: {
      type: String,
      enum: MODULE_VIDEO_STATUSES,
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    uploadedBy: {
      type: Schema18.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema18.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "modulevideos"
  }
);
moduleVideoSchema.index({ module: 1, order: 1 }, { unique: true });
moduleVideoSchema.index({ module: 1, slug: 1 }, { unique: true });
moduleVideoSchema.index({ cloudinaryPublicId: 1 }, { unique: true });
moduleVideoSchema.index({
  module: 1,
  status: 1,
  order: 1
});
var ModuleVideo = model18(
  "ModuleVideo",
  moduleVideoSchema
);

// src/modules/moduleVideos/module.video.service.ts
var throwServiceError8 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound6 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError8(message, statusCode);
  }
};
var isAdminOrManager7 = (role) => {
  return role === "admin" || role === "manager";
};
var setNullableField = (document, path3, value) => {
  if (value === null) {
    document.set(path3, void 0);
    return;
  }
  if (value !== void 0) {
    document.set(path3, value);
  }
};
var ensureCourseModuleExists = async (moduleId) => {
  const courseModule = await CourseModule.findById(moduleId);
  assertFound6(courseModule, "Course module not found", 404);
  if (courseModule.status === "archived") {
    throwServiceError8(
      "Cannot manage videos under an archived course module",
      400
    );
  }
  return courseModule;
};
var createModuleVideo = async (moduleId, payload, actorId) => {
  await ensureCourseModuleExists(moduleId);
  const existingVideo = await ModuleVideo.findOne({
    $or: [
      { module: moduleId, slug: payload.slug },
      { module: moduleId, order: payload.order },
      { cloudinaryPublicId: payload.cloudinaryPublicId }
    ]
  });
  if (existingVideo) {
    throwServiceError8(
      "Video slug, order or Cloudinary public ID already exists",
      409
    );
  }
  const createData = {
    module: new Types20.ObjectId(moduleId),
    title: payload.title,
    slug: payload.slug,
    provider: "cloudinary",
    resourceType: "video",
    cloudinaryPublicId: payload.cloudinaryPublicId,
    secureUrl: payload.secureUrl,
    durationSeconds: payload.durationSeconds,
    isPaid: payload.isPaid ?? false,
    isRequired: payload.isRequired ?? true,
    requiredWatchPercent: payload.requiredWatchPercent ?? 80,
    pointsReward: payload.pointsReward ?? 10,
    order: payload.order,
    uploadStatus: payload.uploadStatus ?? "ready",
    status: "draft",
    uploadedBy: new Types20.ObjectId(actorId)
  };
  const optionalValues = [
    ["description", payload.description],
    ["cloudinaryAssetId", payload.cloudinaryAssetId],
    ["playbackUrl", payload.playbackUrl],
    ["thumbnailUrl", payload.thumbnailUrl],
    ["folder", payload.folder],
    ["format", payload.format],
    ["bytes", payload.bytes],
    ["width", payload.width],
    ["height", payload.height]
  ];
  optionalValues.forEach(([key, value]) => {
    if (value !== void 0) {
      createData[key] = value;
    }
  });
  const video = await ModuleVideo.create(createData);
  return video.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status"
      }
    },
    {
      path: "uploadedBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var getAllModuleVideos = async ({
  actorRole,
  moduleId,
  includeArchived = false
}) => {
  const filter = {};
  if (moduleId) {
    filter.module = new Types20.ObjectId(moduleId);
  }
  const isPrivileged = isAdminOrManager7(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = { $ne: "archived" };
  }
  const query = ModuleVideo.find(filter).sort({ module: 1, order: 1 }).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title isPaid priceCents currency status"
    }
  }).populate("uploadedBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
  if (!isPrivileged) {
    query.select(
      "-secureUrl -playbackUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }
  return query;
};
var getVideosByModule = async (moduleId, actorRole) => {
  const moduleFilter = { _id: moduleId };
  if (!isAdminOrManager7(actorRole)) {
    moduleFilter.status = "published";
  }
  const courseModule = await CourseModule.findOne(moduleFilter).populate(
    "pillar",
    "name slug title isPaid priceCents currency status"
  );
  assertFound6(
    courseModule,
    "Course module not found or unavailable",
    404
  );
  const filter = {
    module: new Types20.ObjectId(moduleId)
  };
  const isPrivileged = isAdminOrManager7(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  } else {
    filter.status = { $ne: "archived" };
  }
  const query = ModuleVideo.find(filter).sort({ order: 1 }).populate("uploadedBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
  if (!isPrivileged) {
    query.select(
      "-secureUrl -playbackUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }
  const videos = await query;
  return {
    module: courseModule,
    videos
  };
};
var getSingleModuleVideo = async (videoId, actorRole) => {
  const filter = {
    _id: videoId
  };
  const isPrivileged = isAdminOrManager7(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  }
  const query = ModuleVideo.findOne(filter).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title isPaid priceCents currency status"
    }
  }).populate("uploadedBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
  if (!isPrivileged) {
    query.select(
      "-secureUrl -playbackUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }
  const video = await query;
  assertFound6(video, "Module video not found", 404);
  return video;
};
var checkVideoAccess = async (videoId, userId) => {
  const video = await ModuleVideo.findById(videoId).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title isPaid priceCents currency status"
    }
  });
  assertFound6(video, "Module video not found", 404);
  if (!video.isPaid) {
    return {
      canWatch: true,
      isLocked: false,
      reason: "free_video",
      playbackUrl: video.playbackUrl ?? video.secureUrl
    };
  }
  const moduleData = video.module;
  const access = await userEntitlementService.checkPillarAccess(
    userId,
    String(moduleData.pillar._id)
  );
  if (!access.hasAccess) {
    return {
      canWatch: false,
      isLocked: true,
      paymentRequired: true,
      reason: "pillar_purchase_required",
      playbackUrl: null,
      secureUrl: null,
      pillar: access.pillar
    };
  }
  return {
    canWatch: true,
    isLocked: false,
    paymentRequired: false,
    reason: "pillar_entitlement_active",
    playbackUrl: video.playbackUrl ?? video.secureUrl
  };
};
var updateModuleVideo = async (videoId, payload, actorId) => {
  const video = await ModuleVideo.findById(videoId);
  assertFound6(video, "Module video not found", 404);
  if (video.status === "archived") {
    throwServiceError8("Archived video cannot be updated", 400);
  }
  const duplicateConditions = [];
  if (payload.slug !== void 0) {
    duplicateConditions.push({ module: video.module, slug: payload.slug });
  }
  if (payload.order !== void 0) {
    duplicateConditions.push({ module: video.module, order: payload.order });
  }
  if (payload.cloudinaryPublicId !== void 0) {
    duplicateConditions.push({
      cloudinaryPublicId: payload.cloudinaryPublicId
    });
  }
  if (duplicateConditions.length > 0) {
    const duplicateVideo = await ModuleVideo.findOne({
      _id: { $ne: video._id },
      $or: duplicateConditions
    });
    if (duplicateVideo) {
      throwServiceError8(
        "Video slug, order or Cloudinary public ID already exists",
        409
      );
    }
  }
  if (payload.title !== void 0) video.title = payload.title;
  if (payload.slug !== void 0) video.slug = payload.slug;
  if (payload.cloudinaryPublicId !== void 0) {
    video.cloudinaryPublicId = payload.cloudinaryPublicId;
  }
  if (payload.secureUrl !== void 0) video.secureUrl = payload.secureUrl;
  if (payload.durationSeconds !== void 0) {
    video.durationSeconds = payload.durationSeconds;
    if (payload.isPaid !== void 0) {
      video.isPaid = payload.isPaid;
    }
  }
  if (payload.isRequired !== void 0) video.isRequired = payload.isRequired;
  if (payload.requiredWatchPercent !== void 0) {
    video.requiredWatchPercent = payload.requiredWatchPercent;
  }
  if (payload.pointsReward !== void 0) {
    video.pointsReward = payload.pointsReward;
  }
  if (payload.order !== void 0) video.order = payload.order;
  if (payload.uploadStatus !== void 0) {
    video.uploadStatus = payload.uploadStatus;
  }
  setNullableField(video, "description", payload.description);
  setNullableField(video, "cloudinaryAssetId", payload.cloudinaryAssetId);
  setNullableField(video, "playbackUrl", payload.playbackUrl);
  setNullableField(video, "thumbnailUrl", payload.thumbnailUrl);
  setNullableField(video, "folder", payload.folder);
  setNullableField(video, "format", payload.format);
  setNullableField(video, "bytes", payload.bytes);
  setNullableField(video, "width", payload.width);
  setNullableField(video, "height", payload.height);
  video.updatedBy = new Types20.ObjectId(actorId);
  await video.save();
  return video.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status"
      }
    },
    {
      path: "updatedBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var publishModuleVideo = async (videoId, actorId) => {
  const video = await ModuleVideo.findById(videoId);
  assertFound6(video, "Module video not found", 404);
  if (video.status === "archived") {
    throwServiceError8("Archived video cannot be published", 400);
  }
  if (video.uploadStatus !== "ready") {
    throwServiceError8("Video upload must be ready before publishing", 400);
  }
  const courseModule = await CourseModule.findById(video.module);
  assertFound6(courseModule, "Parent course module not found", 404);
  if (courseModule.status !== "published") {
    throwServiceError8(
      "Publish the parent course module before publishing this video",
      400
    );
  }
  video.status = "published";
  video.publishedAt = /* @__PURE__ */ new Date();
  video.set("archivedAt", void 0);
  video.updatedBy = new Types20.ObjectId(actorId);
  await video.save();
  return video;
};
var moveModuleVideoToDraft = async (videoId, actorId) => {
  const video = await ModuleVideo.findById(videoId);
  assertFound6(video, "Module video not found", 404);
  if (video.status === "archived") {
    throwServiceError8("Archived video cannot be moved to draft", 400);
  }
  video.status = "draft";
  video.set("publishedAt", void 0);
  video.updatedBy = new Types20.ObjectId(actorId);
  await video.save();
  return video;
};
var archiveModuleVideo = async (videoId, actorId) => {
  const video = await ModuleVideo.findById(videoId);
  assertFound6(video, "Module video not found", 404);
  video.status = "archived";
  video.archivedAt = /* @__PURE__ */ new Date();
  video.set("publishedAt", void 0);
  video.updatedBy = new Types20.ObjectId(actorId);
  await video.save();
  return video;
};
var moduleVideoService = {
  createModuleVideo,
  getAllModuleVideos,
  getVideosByModule,
  getSingleModuleVideo,
  checkVideoAccess,
  updateModuleVideo,
  publishModuleVideo,
  moveModuleVideoToDraft,
  archiveModuleVideo
};

// src/modules/moduleVideos/module.video.controller.ts
var getAuthUser5 = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  return {
    id: String(req.user.id),
    role: String(req.user.role)
  };
};
var throwControllerError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var createModuleVideo2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const moduleId = String(
      req.params.moduleId
    );
    const videoFile = req.file;
    if (!videoFile) {
      throwControllerError(
        'Video file is required in multipart field "video"',
        400
      );
    }
    const body = req.body;
    const uploaded = await uploadVideoToCloudinary(
      videoFile,
      `invictus/module-videos/${moduleId}`
    );
    const payload = {
      title: body.title,
      slug: body.slug,
      cloudinaryPublicId: uploaded.cloudinaryPublicId,
      secureUrl: uploaded.secureUrl,
      durationSeconds: uploaded.durationSeconds,
      isPaid: body.isPaid ?? false,
      isRequired: body.isRequired ?? true,
      requiredWatchPercent: body.requiredWatchPercent ?? 80,
      pointsReward: body.pointsReward ?? 10,
      order: body.order,
      uploadStatus: "ready"
    };
    if (body.description !== void 0) {
      payload.description = body.description;
    }
    if (uploaded.cloudinaryAssetId !== void 0) {
      payload.cloudinaryAssetId = uploaded.cloudinaryAssetId;
    }
    if (uploaded.playbackUrl !== void 0) {
      payload.playbackUrl = uploaded.playbackUrl;
    }
    if (uploaded.thumbnailUrl !== void 0) {
      payload.thumbnailUrl = uploaded.thumbnailUrl;
    }
    if (uploaded.folder !== void 0) {
      payload.folder = uploaded.folder;
    }
    if (uploaded.format !== void 0) {
      payload.format = uploaded.format;
    }
    if (uploaded.bytes !== void 0) {
      payload.bytes = uploaded.bytes;
    }
    if (uploaded.width !== void 0) {
      payload.width = uploaded.width;
    }
    if (uploaded.height !== void 0) {
      payload.height = uploaded.height;
    }
    const result = await moduleVideoService.createModuleVideo(
      moduleId,
      payload,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Module video uploaded and created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllModuleVideos2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const result = await moduleVideoService.getAllModuleVideos({
      actorRole: authUser.role,
      moduleId: typeof req.query.moduleId === "string" ? req.query.moduleId : void 0,
      includeArchived: req.query.includeArchived === "true"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module videos retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getVideosByModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const result = await moduleVideoService.getVideosByModule(
      String(req.params.moduleId),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course module videos retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleModuleVideo2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const result = await moduleVideoService.getSingleModuleVideo(
      String(req.params.id),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module video retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateModuleVideo2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const result = await moduleVideoService.updateModuleVideo(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module video updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var publishModuleVideo2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const result = await moduleVideoService.publishModuleVideo(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module video published successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moveModuleVideoToDraft2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const result = await moduleVideoService.moveModuleVideoToDraft(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module video moved to draft successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var archiveModuleVideo2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser5(req);
    const result = await moduleVideoService.archiveModuleVideo(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module video archived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moduleVideoController = {
  createModuleVideo: createModuleVideo2,
  getAllModuleVideos: getAllModuleVideos2,
  getVideosByModule: getVideosByModule2,
  getSingleModuleVideo: getSingleModuleVideo2,
  updateModuleVideo: updateModuleVideo2,
  publishModuleVideo: publishModuleVideo2,
  moveModuleVideoToDraft: moveModuleVideoToDraft2,
  archiveModuleVideo: archiveModuleVideo2
};

// src/modules/moduleVideos/module.video.validation.ts
import { z as z11 } from "zod";
var mongoObjectIdSchema3 = z11.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var slugSchema = z11.string().trim().min(2).max(200).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Slug may contain lowercase letters, numbers and hyphens only"
);
var createModuleVideoBodySchema = z11.object({
  title: z11.string().trim().min(2).max(200),
  slug: slugSchema,
  description: z11.string().trim().max(3e3).optional(),
  isPaid: z11.boolean().default(false),
  isRequired: z11.boolean().default(true),
  requiredWatchPercent: z11.number().min(1).max(100).default(80),
  pointsReward: z11.number().int().nonnegative().default(10),
  order: z11.number().int().min(1)
});
var updateModuleVideoBodySchema = z11.object({
  title: z11.string().trim().min(2).max(200).optional(),
  slug: slugSchema.optional(),
  description: z11.string().trim().max(3e3).nullable().optional(),
  isPaid: z11.boolean().optional(),
  cloudinaryPublicId: z11.string().trim().min(1).optional(),
  cloudinaryAssetId: z11.string().trim().min(1).nullable().optional(),
  secureUrl: z11.string().url().optional(),
  playbackUrl: z11.string().url().nullable().optional(),
  thumbnailUrl: z11.string().url().nullable().optional(),
  folder: z11.string().trim().min(1).nullable().optional(),
  format: z11.string().trim().min(1).nullable().optional(),
  durationSeconds: z11.number().nonnegative().optional(),
  bytes: z11.number().int().nonnegative().nullable().optional(),
  width: z11.number().int().nonnegative().nullable().optional(),
  height: z11.number().int().nonnegative().nullable().optional(),
  isRequired: z11.boolean().optional(),
  requiredWatchPercent: z11.number().min(1).max(100).optional(),
  pointsReward: z11.number().int().nonnegative().optional(),
  order: z11.number().int().min(1).optional(),
  uploadStatus: z11.enum(VIDEO_UPLOAD_STATUSES).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required"
});
var createModuleVideoValidation = z11.object({
  params: z11.object({
    moduleId: mongoObjectIdSchema3
  }),
  body: createModuleVideoBodySchema
});
var updateModuleVideoValidation = z11.object({
  params: z11.object({
    id: mongoObjectIdSchema3
  }),
  body: updateModuleVideoBodySchema
});
var moduleVideoIdValidation = z11.object({
  params: z11.object({
    id: mongoObjectIdSchema3
  })
});
var moduleVideoModuleValidation = z11.object({
  params: z11.object({
    moduleId: mongoObjectIdSchema3
  })
});

// src/modules/moduleVideos/module.video.route.ts
var router15 = Router15();
router15.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles("admin", "manager"),
  uploadModuleVideo.single("video"),
  normalizeModuleVideoMultipartBody,
  validateRequest_default(createModuleVideoValidation),
  moduleVideoController.createModuleVideo
);
router15.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  moduleVideoController.getAllModuleVideos
);
router15.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(moduleVideoModuleValidation),
  moduleVideoController.getVideosByModule
);
router15.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(moduleVideoIdValidation),
  moduleVideoController.getSingleModuleVideo
);
router15.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(updateModuleVideoValidation),
  moduleVideoController.updateModuleVideo
);
router15.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(moduleVideoIdValidation),
  moduleVideoController.publishModuleVideo
);
router15.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(moduleVideoIdValidation),
  moduleVideoController.moveModuleVideoToDraft
);
router15.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(moduleVideoIdValidation),
  moduleVideoController.archiveModuleVideo
);
var moduleVideoRoutes = router15;

// src/modules/moduleResources/module.resource.route.ts
import { Router as Router16 } from "express";

// src/modules/moduleResources/module.resource.service.ts
import { Types as Types21 } from "mongoose";

// src/modules/moduleResources/module.resource.model.schema.ts
import { model as model19, Schema as Schema19 } from "mongoose";

// src/modules/moduleResources/module.resource.interface.ts
var MODULE_RESOURCE_STATUSES = [
  "draft",
  "published",
  "archived"
];
var MODULE_RESOURCE_TYPES = [
  "pdf",
  "worksheet",
  "template",
  "external_link",
  "other"
];
var MODULE_RESOURCE_PROVIDERS = [
  "cloudinary",
  "external"
];
var CLOUDINARY_RESOURCE_TYPES = [
  "image",
  "raw",
  "video"
];

// src/modules/moduleResources/module.resource.model.schema.ts
var moduleResourceSchema = new Schema19(
  {
    module: {
      type: Schema19.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3e3
    },
    resourceType: {
      type: String,
      enum: MODULE_RESOURCE_TYPES,
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: MODULE_RESOURCE_PROVIDERS,
      required: true
    },
    fileName: {
      type: String,
      trim: true
    },
    mimeType: {
      type: String,
      trim: true
    },
    format: {
      type: String,
      trim: true
    },
    bytes: {
      type: Number,
      min: 0
    },
    cloudinaryPublicId: {
      type: String,
      trim: true
    },
    cloudinaryAssetId: {
      type: String,
      trim: true
    },
    cloudinaryResourceType: {
      type: String,
      enum: CLOUDINARY_RESOURCE_TYPES
    },
    secureUrl: {
      type: String,
      trim: true
    },
    externalUrl: {
      type: String,
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    pointsReward: {
      type: Number,
      default: 5,
      min: 0
    },
    order: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: MODULE_RESOURCE_STATUSES,
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    createdBy: {
      type: Schema19.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema19.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "moduleresources"
  }
);
moduleResourceSchema.index(
  { module: 1, order: 1 },
  { unique: true }
);
moduleResourceSchema.index(
  { module: 1, slug: 1 },
  { unique: true }
);
moduleResourceSchema.index(
  { cloudinaryPublicId: 1 },
  {
    unique: true,
    sparse: true
  }
);
moduleResourceSchema.index({
  module: 1,
  status: 1,
  order: 1
});
var ModuleResource = model19(
  "ModuleResource",
  moduleResourceSchema
);

// src/modules/moduleResources/module.resource.service.ts
var throwServiceError9 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound7 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError9(message, statusCode);
  }
};
var isAdminOrManager8 = (role) => {
  return role === "admin" || role === "manager";
};
var setNullableField2 = (document, path3, value) => {
  if (value === null) {
    document.set(path3, void 0);
    return;
  }
  if (value !== void 0) {
    document.set(path3, value);
  }
};
var ensureCourseModuleExists2 = async (moduleId) => {
  const courseModule = await CourseModule.findById(moduleId);
  assertFound7(courseModule, "Course module not found", 404);
  if (courseModule.status === "archived") {
    throwServiceError9(
      "Cannot manage resources under an archived course module",
      400
    );
  }
  return courseModule;
};
var validateResourceConfiguration = ({
  provider,
  cloudinaryPublicId,
  secureUrl,
  externalUrl
}) => {
  if (provider === "cloudinary") {
    if (!cloudinaryPublicId || !secureUrl) {
      throwServiceError9(
        "Cloudinary resource requires cloudinaryPublicId and secureUrl",
        400
      );
    }
  }
  if (provider === "external" && !externalUrl) {
    throwServiceError9("External resource requires externalUrl", 400);
  }
};
var createModuleResource = async (moduleId, payload, actorId) => {
  await ensureCourseModuleExists2(moduleId);
  validateResourceConfiguration({
    provider: payload.provider,
    cloudinaryPublicId: payload.cloudinaryPublicId,
    secureUrl: payload.secureUrl,
    externalUrl: payload.externalUrl
  });
  const duplicateConditions = [
    { module: moduleId, slug: payload.slug },
    { module: moduleId, order: payload.order }
  ];
  if (payload.cloudinaryPublicId) {
    duplicateConditions.push({
      cloudinaryPublicId: payload.cloudinaryPublicId
    });
  }
  const existingResource = await ModuleResource.findOne({
    $or: duplicateConditions
  });
  if (existingResource) {
    throwServiceError9(
      "Resource slug, order or Cloudinary public ID already exists",
      409
    );
  }
  const createData = {
    module: new Types21.ObjectId(moduleId),
    title: payload.title,
    slug: payload.slug,
    resourceType: payload.resourceType,
    provider: payload.provider,
    isRequired: payload.isRequired ?? true,
    pointsReward: payload.pointsReward ?? 5,
    order: payload.order,
    status: "draft",
    createdBy: new Types21.ObjectId(actorId)
  };
  const optionalValues = [
    ["description", payload.description],
    ["fileName", payload.fileName],
    ["mimeType", payload.mimeType],
    ["format", payload.format],
    ["bytes", payload.bytes],
    ["cloudinaryPublicId", payload.cloudinaryPublicId],
    ["cloudinaryAssetId", payload.cloudinaryAssetId],
    ["cloudinaryResourceType", payload.cloudinaryResourceType],
    ["secureUrl", payload.secureUrl],
    ["externalUrl", payload.externalUrl],
    ["thumbnailUrl", payload.thumbnailUrl]
  ];
  optionalValues.forEach(([key, value]) => {
    if (value !== void 0) {
      createData[key] = value;
    }
  });
  const resource = await ModuleResource.create(createData);
  return resource.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status"
      }
    },
    {
      path: "createdBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var getAllModuleResources = async ({
  actorRole,
  moduleId,
  includeArchived = false
}) => {
  const filter = {};
  if (moduleId) {
    filter.module = new Types21.ObjectId(moduleId);
  }
  const isPrivileged = isAdminOrManager8(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = { $ne: "archived" };
  }
  const query = ModuleResource.find(filter).sort({ module: 1, order: 1 }).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title isPaid priceCents currency status"
    }
  }).populate("createdBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
  if (!isPrivileged) {
    query.select(
      "-secureUrl -externalUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }
  return query;
};
var getResourcesByModule = async (moduleId, actorRole) => {
  const moduleFilter = { _id: moduleId };
  if (!isAdminOrManager8(actorRole)) {
    moduleFilter.status = "published";
  }
  const courseModule = await CourseModule.findOne(moduleFilter).populate(
    "pillar",
    "name slug title isPaid priceCents currency status"
  );
  assertFound7(
    courseModule,
    "Course module not found or unavailable",
    404
  );
  const filter = {
    module: new Types21.ObjectId(moduleId)
  };
  const isPrivileged = isAdminOrManager8(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  } else {
    filter.status = { $ne: "archived" };
  }
  const query = ModuleResource.find(filter).sort({ order: 1 }).populate("createdBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
  if (!isPrivileged) {
    query.select(
      "-secureUrl -externalUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }
  const resources = await query;
  return {
    module: courseModule,
    resources
  };
};
var getSingleModuleResource = async (resourceId, actorRole) => {
  const filter = {
    _id: resourceId
  };
  const isPrivileged = isAdminOrManager8(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  }
  const query = ModuleResource.findOne(filter).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title isPaid priceCents currency status"
    }
  }).populate("createdBy", "fullName email role profileImage").populate("updatedBy", "fullName email role profileImage");
  if (!isPrivileged) {
    query.select(
      "-secureUrl -externalUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }
  const resource = await query;
  assertFound7(resource, "Module resource not found", 404);
  return resource;
};
var updateModuleResource = async (resourceId, payload, actorId) => {
  const resource = await ModuleResource.findById(resourceId);
  assertFound7(resource, "Module resource not found", 404);
  if (resource.status === "archived") {
    throwServiceError9("Archived resource cannot be updated", 400);
  }
  const nextProvider = payload.provider ?? resource.provider;
  const nextCloudinaryPublicId = payload.cloudinaryPublicId === null ? void 0 : payload.cloudinaryPublicId ?? resource.cloudinaryPublicId;
  const nextSecureUrl = payload.secureUrl === null ? void 0 : payload.secureUrl ?? resource.secureUrl;
  const nextExternalUrl = payload.externalUrl === null ? void 0 : payload.externalUrl ?? resource.externalUrl;
  validateResourceConfiguration({
    provider: nextProvider,
    cloudinaryPublicId: nextCloudinaryPublicId,
    secureUrl: nextSecureUrl,
    externalUrl: nextExternalUrl
  });
  const duplicateConditions = [];
  if (payload.slug !== void 0) {
    duplicateConditions.push({ module: resource.module, slug: payload.slug });
  }
  if (payload.order !== void 0) {
    duplicateConditions.push({ module: resource.module, order: payload.order });
  }
  if (nextCloudinaryPublicId) {
    duplicateConditions.push({
      cloudinaryPublicId: nextCloudinaryPublicId
    });
  }
  if (duplicateConditions.length > 0) {
    const duplicateResource = await ModuleResource.findOne({
      _id: { $ne: resource._id },
      $or: duplicateConditions
    });
    if (duplicateResource) {
      throwServiceError9(
        "Resource slug, order or Cloudinary public ID already exists",
        409
      );
    }
  }
  if (payload.title !== void 0) resource.title = payload.title;
  if (payload.slug !== void 0) resource.slug = payload.slug;
  if (payload.resourceType !== void 0) {
    resource.resourceType = payload.resourceType;
  }
  if (payload.provider !== void 0) resource.provider = payload.provider;
  if (payload.isRequired !== void 0) {
    resource.isRequired = payload.isRequired;
  }
  if (payload.pointsReward !== void 0) {
    resource.pointsReward = payload.pointsReward;
  }
  if (payload.order !== void 0) resource.order = payload.order;
  setNullableField2(resource, "description", payload.description);
  setNullableField2(resource, "fileName", payload.fileName);
  setNullableField2(resource, "mimeType", payload.mimeType);
  setNullableField2(resource, "format", payload.format);
  setNullableField2(resource, "bytes", payload.bytes);
  setNullableField2(
    resource,
    "cloudinaryPublicId",
    payload.cloudinaryPublicId
  );
  setNullableField2(
    resource,
    "cloudinaryAssetId",
    payload.cloudinaryAssetId
  );
  setNullableField2(
    resource,
    "cloudinaryResourceType",
    payload.cloudinaryResourceType
  );
  setNullableField2(resource, "secureUrl", payload.secureUrl);
  setNullableField2(resource, "externalUrl", payload.externalUrl);
  setNullableField2(resource, "thumbnailUrl", payload.thumbnailUrl);
  resource.updatedBy = new Types21.ObjectId(actorId);
  await resource.save();
  return resource.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status"
      }
    },
    {
      path: "updatedBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var publishModuleResource = async (resourceId, actorId) => {
  const resource = await ModuleResource.findById(resourceId);
  assertFound7(resource, "Module resource not found", 404);
  if (resource.status === "archived") {
    throwServiceError9("Archived resource cannot be published", 400);
  }
  validateResourceConfiguration({
    provider: resource.provider,
    cloudinaryPublicId: resource.cloudinaryPublicId,
    secureUrl: resource.secureUrl,
    externalUrl: resource.externalUrl
  });
  const courseModule = await CourseModule.findById(resource.module);
  assertFound7(courseModule, "Parent course module not found", 404);
  if (courseModule.status !== "published") {
    throwServiceError9(
      "Publish the parent course module before publishing this resource",
      400
    );
  }
  resource.status = "published";
  resource.publishedAt = /* @__PURE__ */ new Date();
  resource.set("archivedAt", void 0);
  resource.updatedBy = new Types21.ObjectId(actorId);
  await resource.save();
  return resource;
};
var moveModuleResourceToDraft = async (resourceId, actorId) => {
  const resource = await ModuleResource.findById(resourceId);
  assertFound7(resource, "Module resource not found", 404);
  if (resource.status === "archived") {
    throwServiceError9("Archived resource cannot be moved to draft", 400);
  }
  resource.status = "draft";
  resource.set("publishedAt", void 0);
  resource.updatedBy = new Types21.ObjectId(actorId);
  await resource.save();
  return resource;
};
var archiveModuleResource = async (resourceId, actorId) => {
  const resource = await ModuleResource.findById(resourceId);
  assertFound7(resource, "Module resource not found", 404);
  resource.status = "archived";
  resource.archivedAt = /* @__PURE__ */ new Date();
  resource.set("publishedAt", void 0);
  resource.updatedBy = new Types21.ObjectId(actorId);
  await resource.save();
  return resource;
};
var moduleResourceService = {
  createModuleResource,
  getAllModuleResources,
  getResourcesByModule,
  getSingleModuleResource,
  updateModuleResource,
  publishModuleResource,
  moveModuleResourceToDraft,
  archiveModuleResource
};

// src/modules/moduleResources/module.resource.controller.ts
var getAuthUser6 = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  return {
    id: String(req.user.id),
    role: String(req.user.role)
  };
};
var throwControllerError2 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var createModuleResource2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const moduleId = String(req.params.moduleId);
    const body = req.body;
    const payload = {
      title: body.title,
      slug: body.slug,
      resourceType: body.resourceType,
      provider: body.provider,
      isRequired: body.isRequired ?? true,
      pointsReward: body.pointsReward ?? 5,
      order: body.order
    };
    if (body.description !== void 0) {
      payload.description = body.description;
    }
    if (body.externalUrl !== void 0) {
      payload.externalUrl = body.externalUrl;
    }
    if (body.provider === "cloudinary") {
      const resourceFile = getUploadedFieldFile(req, "resource");
      const thumbnailFile = getUploadedFieldFile(req, "thumbnail");
      if (!resourceFile) {
        throwControllerError2(
          'Cloudinary resource requires a file in multipart field "resource"',
          400
        );
      }
      const uploadedResource = await uploadResourceToCloudinary(
        resourceFile,
        `invictus/module-resources/${moduleId}`
      );
      payload.fileName = uploadedResource.fileName;
      payload.mimeType = uploadedResource.mimeType;
      payload.cloudinaryPublicId = uploadedResource.cloudinaryPublicId;
      payload.cloudinaryResourceType = uploadedResource.cloudinaryResourceType;
      payload.secureUrl = uploadedResource.secureUrl;
      if (uploadedResource.cloudinaryAssetId !== void 0) {
        payload.cloudinaryAssetId = uploadedResource.cloudinaryAssetId;
      }
      if (uploadedResource.format !== void 0) {
        payload.format = uploadedResource.format;
      }
      if (uploadedResource.bytes !== void 0) {
        payload.bytes = uploadedResource.bytes;
      }
      if (thumbnailFile) {
        payload.thumbnailUrl = await uploadThumbnailToCloudinary(
          thumbnailFile,
          `invictus/module-resources/${moduleId}/thumbnails`
        );
      } else if (uploadedResource.thumbnailUrl !== void 0) {
        payload.thumbnailUrl = uploadedResource.thumbnailUrl;
      }
    }
    const result = await moduleResourceService.createModuleResource(
      moduleId,
      payload,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Module resource uploaded and created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllModuleResources2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const result = await moduleResourceService.getAllModuleResources({
      actorRole: authUser.role,
      moduleId: typeof req.query.moduleId === "string" ? req.query.moduleId : void 0,
      includeArchived: req.query.includeArchived === "true"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module resources retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getResourcesByModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const result = await moduleResourceService.getResourcesByModule(
      String(req.params.moduleId),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Course module resources retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleModuleResource2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const result = await moduleResourceService.getSingleModuleResource(
      String(req.params.id),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module resource retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateModuleResource2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const result = await moduleResourceService.updateModuleResource(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module resource updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var publishModuleResource2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const result = await moduleResourceService.publishModuleResource(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module resource published successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moveModuleResourceToDraft2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const result = await moduleResourceService.moveModuleResourceToDraft(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module resource moved to draft successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var archiveModuleResource2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser6(req);
    const result = await moduleResourceService.archiveModuleResource(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module resource archived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moduleResourceController = {
  createModuleResource: createModuleResource2,
  getAllModuleResources: getAllModuleResources2,
  getResourcesByModule: getResourcesByModule2,
  getSingleModuleResource: getSingleModuleResource2,
  updateModuleResource: updateModuleResource2,
  publishModuleResource: publishModuleResource2,
  moveModuleResourceToDraft: moveModuleResourceToDraft2,
  archiveModuleResource: archiveModuleResource2
};

// src/modules/moduleResources/module.resource.validation.ts
import { z as z12 } from "zod";
var mongoObjectIdSchema4 = z12.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var slugSchema2 = z12.string().trim().min(2).max(200).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Slug may contain lowercase letters, numbers and hyphens only"
);
var createModuleResourceBodySchema = z12.object({
  title: z12.string().trim().min(2).max(200),
  slug: slugSchema2,
  description: z12.string().trim().max(3e3).optional(),
  resourceType: z12.enum(MODULE_RESOURCE_TYPES),
  provider: z12.enum(MODULE_RESOURCE_PROVIDERS),
  externalUrl: z12.string().url().optional(),
  isRequired: z12.boolean().default(true),
  pointsReward: z12.number().int().nonnegative().default(5),
  order: z12.number().int().min(1)
}).superRefine((data, context) => {
  if (data.provider === "external" && !data.externalUrl) {
    context.addIssue({
      code: z12.ZodIssueCode.custom,
      path: ["externalUrl"],
      message: "External resource requires externalUrl"
    });
  }
  if (data.provider === "cloudinary" && data.externalUrl) {
    context.addIssue({
      code: z12.ZodIssueCode.custom,
      path: ["externalUrl"],
      message: "Cloudinary resource cannot have externalUrl"
    });
  }
});
var updateModuleResourceBodySchema = z12.object({
  title: z12.string().trim().min(2).max(200).optional(),
  slug: slugSchema2.optional(),
  description: z12.string().trim().max(3e3).nullable().optional(),
  resourceType: z12.enum(MODULE_RESOURCE_TYPES).optional(),
  provider: z12.enum(MODULE_RESOURCE_PROVIDERS).optional(),
  fileName: z12.string().trim().min(1).nullable().optional(),
  mimeType: z12.string().trim().min(1).nullable().optional(),
  format: z12.string().trim().min(1).nullable().optional(),
  bytes: z12.number().int().nonnegative().nullable().optional(),
  cloudinaryPublicId: z12.string().trim().min(1).nullable().optional(),
  cloudinaryAssetId: z12.string().trim().min(1).nullable().optional(),
  cloudinaryResourceType: z12.enum(CLOUDINARY_RESOURCE_TYPES).nullable().optional(),
  secureUrl: z12.string().url().nullable().optional(),
  externalUrl: z12.string().url().nullable().optional(),
  thumbnailUrl: z12.string().url().nullable().optional(),
  isRequired: z12.boolean().optional(),
  pointsReward: z12.number().int().nonnegative().optional(),
  order: z12.number().int().min(1).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required"
});
var createModuleResourceValidation = z12.object({
  params: z12.object({
    moduleId: mongoObjectIdSchema4
  }),
  body: createModuleResourceBodySchema
});
var updateModuleResourceValidation = z12.object({
  params: z12.object({
    id: mongoObjectIdSchema4
  }),
  body: updateModuleResourceBodySchema
});
var moduleResourceIdValidation = z12.object({
  params: z12.object({
    id: mongoObjectIdSchema4
  })
});
var moduleResourceModuleValidation = z12.object({
  params: z12.object({
    moduleId: mongoObjectIdSchema4
  })
});

// src/modules/moduleResources/module.resource.route.ts
var router16 = Router16();
router16.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles("admin", "manager"),
  uploadModuleResourceFields,
  normalizeModuleResourceMultipartBody,
  validateRequest_default(createModuleResourceValidation),
  moduleResourceController.createModuleResource
);
router16.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  moduleResourceController.getAllModuleResources
);
router16.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(moduleResourceModuleValidation),
  moduleResourceController.getResourcesByModule
);
router16.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(moduleResourceIdValidation),
  moduleResourceController.getSingleModuleResource
);
router16.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(updateModuleResourceValidation),
  moduleResourceController.updateModuleResource
);
router16.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(moduleResourceIdValidation),
  moduleResourceController.publishModuleResource
);
router16.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(moduleResourceIdValidation),
  moduleResourceController.moveModuleResourceToDraft
);
router16.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(moduleResourceIdValidation),
  moduleResourceController.archiveModuleResource
);
var moduleResourceRoutes = router16;

// src/modules/quizeQuestions/quiz.question.route.ts
import { Router as Router17 } from "express";

// src/modules/quizeQuestions/quiz.question.service.ts
import {
  Types as Types22
} from "mongoose";

// src/modules/quizeQuestions/quiz.question.model.schema.ts
import {
  model as model20,
  Schema as Schema20
} from "mongoose";

// src/modules/quizeQuestions/quiz.question.interface.ts
var QUIZ_QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "true_false"
];
var QUIZ_QUESTION_STATUSES = [
  "draft",
  "published",
  "archived"
];

// src/modules/quizeQuestions/quiz.question.model.schema.ts
var quizQuestionSchema = new Schema20(
  {
    module: {
      type: Schema20.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2e3
    },
    questionType: {
      type: String,
      enum: QUIZ_QUESTION_TYPES,
      required: true
    },
    options: {
      type: [
        {
          type: String,
          trim: true
        }
      ],
      default: void 0
    },
    correctOptionIndexes: {
      type: [
        {
          type: Number,
          min: 0
        }
      ],
      default: void 0
    },
    correctBooleanAnswer: {
      type: Boolean
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: 5e3
    },
    order: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: QUIZ_QUESTION_STATUSES,
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    createdBy: {
      type: Schema20.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema20.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "quizquestions"
  }
);
quizQuestionSchema.index(
  {
    module: 1,
    order: 1
  },
  {
    unique: true
  }
);
quizQuestionSchema.index({
  module: 1,
  status: 1,
  order: 1
});
var QuizQuestion = model20(
  "QuizQuestion",
  quizQuestionSchema
);

// src/modules/quizeQuestions/quiz.question.service.ts
var MAX_QUESTIONS_PER_MODULE = 5;
var throwServiceError10 = (message, statusCode) => {
  const error = new Error(
    message
  );
  error.statusCode = statusCode;
  throw error;
};
var assertFound8 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError10(
      message,
      statusCode
    );
  }
};
var assertValidObjectId4 = (value, fieldName) => {
  if (!Types22.ObjectId.isValid(value)) {
    throwServiceError10(
      `${fieldName} is invalid`,
      400
    );
  }
};
var isAdminOrManager9 = (role) => {
  return role === "admin" || role === "manager";
};
var isDuplicateKeyError2 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var validateQuestionConfiguration = ({
  questionType,
  options: options2,
  correctOptionIndexes,
  correctBooleanAnswer
}) => {
  if (questionType === "true_false") {
    if (typeof correctBooleanAnswer !== "boolean") {
      return throwServiceError10(
        "True/false question requires correctBooleanAnswer",
        400
      );
    }
    return;
  }
  if (!options2 || options2.length < 2) {
    return throwServiceError10(
      "Choice question requires at least two options",
      400
    );
  }
  if (!correctOptionIndexes || correctOptionIndexes.length === 0) {
    return throwServiceError10(
      "Choice question requires correct option indexes",
      400
    );
  }
  const normalizedOptions = options2.map(
    (option) => option.trim().toLowerCase()
  );
  if (new Set(normalizedOptions).size !== options2.length) {
    return throwServiceError10(
      "Quiz question options must be unique",
      400
    );
  }
  const uniqueCorrectIndexes = new Set(correctOptionIndexes);
  if (uniqueCorrectIndexes.size !== correctOptionIndexes.length) {
    return throwServiceError10(
      "Correct option indexes must be unique",
      400
    );
  }
  for (const index of correctOptionIndexes) {
    if (index < 0 || index >= options2.length) {
      return throwServiceError10(
        "Correct option index is outside the available options",
        400
      );
    }
  }
  if (questionType === "single_choice" && correctOptionIndexes.length !== 1) {
    return throwServiceError10(
      "Single-choice question requires exactly one correct option",
      400
    );
  }
};
var ensureCourseModuleExists3 = async (moduleId) => {
  assertValidObjectId4(
    moduleId,
    "Course module ID"
  );
  const courseModule = await CourseModule.findById(
    moduleId
  );
  assertFound8(
    courseModule,
    "Course module not found",
    404
  );
  if (courseModule.status === "archived") {
    throwServiceError10(
      "Cannot manage quiz questions under an archived module",
      400
    );
  }
  return courseModule;
};
var createQuizQuestion = async (moduleId, payload, actorId) => {
  await ensureCourseModuleExists3(
    moduleId
  );
  validateQuestionConfiguration({
    questionType: payload.questionType,
    options: payload.options,
    correctOptionIndexes: payload.correctOptionIndexes,
    correctBooleanAnswer: payload.correctBooleanAnswer
  });
  const activeQuestionCount = await QuizQuestion.countDocuments({
    module: moduleId,
    status: {
      $ne: "archived"
    }
  });
  if (activeQuestionCount >= MAX_QUESTIONS_PER_MODULE) {
    throwServiceError10(
      `A module can contain a maximum of ${MAX_QUESTIONS_PER_MODULE} active quiz questions`,
      400
    );
  }
  const existingQuestion = await QuizQuestion.findOne({
    module: moduleId,
    order: payload.order
  });
  if (existingQuestion) {
    throwServiceError10(
      "Question order already exists in this module",
      409
    );
  }
  const createData = {
    module: new Types22.ObjectId(moduleId),
    question: payload.question,
    questionType: payload.questionType,
    order: payload.order,
    status: "draft",
    createdBy: new Types22.ObjectId(actorId)
  };
  if (payload.questionType === "true_false") {
    createData.correctBooleanAnswer = payload.correctBooleanAnswer;
  } else {
    createData.options = payload.options;
    createData.correctOptionIndexes = payload.correctOptionIndexes;
  }
  if (payload.explanation !== void 0) {
    createData.explanation = payload.explanation;
  }
  try {
    const question = await QuizQuestion.create(
      createData
    );
    return question.populate([
      {
        path: "module",
        select: "title slug moduleNumber pillar status",
        populate: {
          path: "pillar",
          model: "ChallengePillar",
          select: "name slug title status"
        }
      },
      {
        path: "createdBy",
        select: "fullName email role profileImage"
      }
    ]);
  } catch (error) {
    if (isDuplicateKeyError2(error)) {
      throwServiceError10(
        "Question order already exists in this module",
        409
      );
    }
    throw error;
  }
};
var getAllQuizQuestions = async ({
  actorRole,
  moduleId,
  includeArchived = false
}) => {
  const filter = {};
  if (moduleId) {
    assertValidObjectId4(
      moduleId,
      "Course module ID"
    );
    filter.module = new Types22.ObjectId(moduleId);
  }
  const isPrivileged = isAdminOrManager9(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived"
    };
  }
  const query = QuizQuestion.find(filter).sort({
    module: 1,
    order: 1
  }).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title status"
    }
  }).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
  if (!isPrivileged) {
    query.select(
      [
        "-correctOptionIndexes",
        "-correctBooleanAnswer",
        "-explanation"
      ].join(" ")
    );
  }
  return query;
};
var getQuestionsByModule = async (moduleId, actorRole) => {
  assertValidObjectId4(
    moduleId,
    "Course module ID"
  );
  const isPrivileged = isAdminOrManager9(actorRole);
  const moduleFilter = {
    _id: moduleId
  };
  if (!isPrivileged) {
    moduleFilter.status = "published";
  }
  const courseModule = await CourseModule.findOne(
    moduleFilter
  ).populate(
    "pillar",
    "name slug title status"
  );
  assertFound8(
    courseModule,
    "Course module not found or unavailable",
    404
  );
  const questionFilter = {
    module: new Types22.ObjectId(moduleId)
  };
  if (!isPrivileged) {
    questionFilter.status = "published";
  } else {
    questionFilter.status = {
      $ne: "archived"
    };
  }
  const query = QuizQuestion.find(
    questionFilter
  ).sort({ order: 1 }).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
  if (!isPrivileged) {
    query.select(
      [
        "-correctOptionIndexes",
        "-correctBooleanAnswer",
        "-explanation"
      ].join(" ")
    );
  }
  const questions = await query;
  return {
    module: courseModule,
    questions
  };
};
var getSingleQuizQuestion = async (questionId, actorRole) => {
  assertValidObjectId4(
    questionId,
    "Quiz question ID"
  );
  const filter = {
    _id: questionId
  };
  const isPrivileged = isAdminOrManager9(actorRole);
  if (!isPrivileged) {
    filter.status = "published";
  }
  const query = QuizQuestion.findOne(filter).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title status"
    }
  }).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
  if (!isPrivileged) {
    query.select(
      [
        "-correctOptionIndexes",
        "-correctBooleanAnswer",
        "-explanation"
      ].join(" ")
    );
  }
  const question = await query;
  assertFound8(
    question,
    "Quiz question not found",
    404
  );
  return question;
};
var updateQuizQuestion = async (questionId, payload, actorId) => {
  assertValidObjectId4(
    questionId,
    "Quiz question ID"
  );
  const question = await QuizQuestion.findById(
    questionId
  );
  assertFound8(
    question,
    "Quiz question not found",
    404
  );
  if (question.status === "archived") {
    throwServiceError10(
      "Archived question cannot be updated",
      400
    );
  }
  if (payload.order !== void 0 && payload.order !== question.order) {
    const duplicateQuestion = await QuizQuestion.findOne({
      _id: {
        $ne: question._id
      },
      module: question.module,
      order: payload.order
    });
    if (duplicateQuestion) {
      throwServiceError10(
        "Question order already exists in this module",
        409
      );
    }
  }
  const nextQuestionType = payload.questionType ?? question.questionType;
  let nextOptions;
  if (payload.options === null) {
    nextOptions = void 0;
  } else if (payload.options !== void 0) {
    nextOptions = payload.options;
  } else {
    nextOptions = question.options ? [...question.options] : void 0;
  }
  let nextCorrectOptionIndexes;
  if (payload.correctOptionIndexes === null) {
    nextCorrectOptionIndexes = void 0;
  } else if (payload.correctOptionIndexes !== void 0) {
    nextCorrectOptionIndexes = payload.correctOptionIndexes;
  } else {
    nextCorrectOptionIndexes = question.correctOptionIndexes ? [
      ...question.correctOptionIndexes
    ] : void 0;
  }
  let nextCorrectBooleanAnswer;
  if (payload.correctBooleanAnswer === null) {
    nextCorrectBooleanAnswer = void 0;
  } else if (payload.correctBooleanAnswer !== void 0) {
    nextCorrectBooleanAnswer = payload.correctBooleanAnswer;
  } else {
    nextCorrectBooleanAnswer = question.correctBooleanAnswer;
  }
  if (nextQuestionType === "true_false") {
    nextOptions = void 0;
    nextCorrectOptionIndexes = void 0;
  } else {
    nextCorrectBooleanAnswer = void 0;
  }
  validateQuestionConfiguration({
    questionType: nextQuestionType,
    options: nextOptions,
    correctOptionIndexes: nextCorrectOptionIndexes,
    correctBooleanAnswer: nextCorrectBooleanAnswer
  });
  if (payload.question !== void 0) {
    question.question = payload.question;
  }
  question.questionType = nextQuestionType;
  question.set(
    "options",
    nextOptions
  );
  question.set(
    "correctOptionIndexes",
    nextCorrectOptionIndexes
  );
  question.set(
    "correctBooleanAnswer",
    nextCorrectBooleanAnswer
  );
  if (payload.explanation === null) {
    question.set(
      "explanation",
      void 0
    );
  } else if (payload.explanation !== void 0) {
    question.explanation = payload.explanation;
  }
  if (payload.order !== void 0) {
    question.order = payload.order;
  }
  question.updatedBy = new Types22.ObjectId(actorId);
  try {
    await question.save();
  } catch (error) {
    if (isDuplicateKeyError2(error)) {
      throwServiceError10(
        "Question order already exists in this module",
        409
      );
    }
    throw error;
  }
  return question.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title status"
      }
    },
    {
      path: "updatedBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var publishQuizQuestion = async (questionId, actorId) => {
  assertValidObjectId4(
    questionId,
    "Quiz question ID"
  );
  const question = await QuizQuestion.findById(
    questionId
  );
  assertFound8(
    question,
    "Quiz question not found",
    404
  );
  if (question.status === "archived") {
    throwServiceError10(
      "Archived question cannot be published",
      400
    );
  }
  validateQuestionConfiguration({
    questionType: question.questionType,
    options: question.options ? [...question.options] : void 0,
    correctOptionIndexes: question.correctOptionIndexes ? [
      ...question.correctOptionIndexes
    ] : void 0,
    correctBooleanAnswer: question.correctBooleanAnswer
  });
  const courseModule = await CourseModule.findById(
    question.module
  );
  assertFound8(
    courseModule,
    "Parent course module not found",
    404
  );
  if (courseModule.status !== "published") {
    throwServiceError10(
      "Publish the parent course module before publishing this question",
      400
    );
  }
  question.status = "published";
  question.publishedAt = /* @__PURE__ */ new Date();
  question.set(
    "archivedAt",
    void 0
  );
  question.updatedBy = new Types22.ObjectId(actorId);
  await question.save();
  return question;
};
var moveQuizQuestionToDraft = async (questionId, actorId) => {
  assertValidObjectId4(
    questionId,
    "Quiz question ID"
  );
  const question = await QuizQuestion.findById(
    questionId
  );
  assertFound8(
    question,
    "Quiz question not found",
    404
  );
  if (question.status === "archived") {
    throwServiceError10(
      "Archived question cannot be moved to draft",
      400
    );
  }
  question.status = "draft";
  question.set(
    "publishedAt",
    void 0
  );
  question.updatedBy = new Types22.ObjectId(actorId);
  await question.save();
  return question;
};
var archiveQuizQuestion = async (questionId, actorId) => {
  assertValidObjectId4(
    questionId,
    "Quiz question ID"
  );
  const question = await QuizQuestion.findById(
    questionId
  );
  assertFound8(
    question,
    "Quiz question not found",
    404
  );
  question.status = "archived";
  question.archivedAt = /* @__PURE__ */ new Date();
  question.set(
    "publishedAt",
    void 0
  );
  question.updatedBy = new Types22.ObjectId(actorId);
  await question.save();
  return question;
};
var quizQuestionService = {
  createQuizQuestion,
  getAllQuizQuestions,
  getQuestionsByModule,
  getSingleQuizQuestion,
  updateQuizQuestion,
  publishQuizQuestion,
  moveQuizQuestionToDraft,
  archiveQuizQuestion
};

// src/modules/quizeQuestions/quiz.question.controller.ts
var throwControllerError3 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var getAuthUser7 = (req) => {
  const user = req.user;
  if (!user) {
    return throwControllerError3("Authentication required", 401);
  }
  return {
    id: user.id,
    role: user.role
  };
};
var createQuizQuestion2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const result = await quizQuestionService.createQuizQuestion(
      String(
        req.params.moduleId
      ),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Quiz question created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllQuizQuestions2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const moduleId = typeof req.query.moduleId === "string" ? req.query.moduleId : void 0;
    const result = await quizQuestionService.getAllQuizQuestions({
      actorRole: authUser.role,
      ...moduleId !== void 0 ? { moduleId } : {},
      includeArchived: req.query.includeArchived === "true"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz questions retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getQuestionsByModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const result = await quizQuestionService.getQuestionsByModule(
      String(
        req.params.moduleId
      ),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module quiz questions retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleQuizQuestion2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const result = await quizQuestionService.getSingleQuizQuestion(
      String(req.params.id),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz question retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateQuizQuestion2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const result = await quizQuestionService.updateQuizQuestion(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz question updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var publishQuizQuestion2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const result = await quizQuestionService.publishQuizQuestion(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz question published successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moveQuizQuestionToDraft2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const result = await quizQuestionService.moveQuizQuestionToDraft(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz question moved to draft successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var archiveQuizQuestion2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser7(req);
    const result = await quizQuestionService.archiveQuizQuestion(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz question archived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var quizQuestionController = {
  createQuizQuestion: createQuizQuestion2,
  getAllQuizQuestions: getAllQuizQuestions2,
  getQuestionsByModule: getQuestionsByModule2,
  getSingleQuizQuestion: getSingleQuizQuestion2,
  updateQuizQuestion: updateQuizQuestion2,
  publishQuizQuestion: publishQuizQuestion2,
  moveQuizQuestionToDraft: moveQuizQuestionToDraft2,
  archiveQuizQuestion: archiveQuizQuestion2
};

// src/modules/quizeQuestions/quiz.question.validation.ts
import { z as z13 } from "zod";
var mongoObjectIdSchema5 = z13.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid MongoDB ObjectId"
);
var optionSchema = z13.string().trim().min(1).max(500);
var createQuizQuestionBodySchema = z13.object({
  question: z13.string().trim().min(2).max(2e3),
  questionType: z13.enum(
    QUIZ_QUESTION_TYPES
  ),
  options: z13.array(optionSchema).min(2).max(8).optional(),
  correctOptionIndexes: z13.array(
    z13.number().int().nonnegative()
  ).min(1).max(8).optional(),
  correctBooleanAnswer: z13.boolean().optional(),
  explanation: z13.string().trim().max(5e3).optional(),
  order: z13.number().int().min(1)
}).superRefine(
  (data, context) => {
    if (data.questionType === "true_false") {
      if (typeof data.correctBooleanAnswer !== "boolean") {
        context.addIssue({
          code: z13.ZodIssueCode.custom,
          path: [
            "correctBooleanAnswer"
          ],
          message: "True/false question requires correctBooleanAnswer"
        });
      }
      return;
    }
    if (!data.options || data.options.length < 2) {
      context.addIssue({
        code: z13.ZodIssueCode.custom,
        path: ["options"],
        message: "Choice question requires at least two options"
      });
    }
    if (!data.correctOptionIndexes || data.correctOptionIndexes.length === 0) {
      context.addIssue({
        code: z13.ZodIssueCode.custom,
        path: [
          "correctOptionIndexes"
        ],
        message: "Choice question requires correct option indexes"
      });
    }
    if (data.questionType === "single_choice" && data.correctOptionIndexes && data.correctOptionIndexes.length !== 1) {
      context.addIssue({
        code: z13.ZodIssueCode.custom,
        path: [
          "correctOptionIndexes"
        ],
        message: "Single-choice question requires exactly one correct option"
      });
    }
  }
);
var updateQuizQuestionBodySchema = z13.object({
  question: z13.string().trim().min(2).max(2e3).optional(),
  questionType: z13.enum(
    QUIZ_QUESTION_TYPES
  ).optional(),
  options: z13.array(optionSchema).min(2).max(8).nullable().optional(),
  correctOptionIndexes: z13.array(
    z13.number().int().nonnegative()
  ).min(1).max(8).nullable().optional(),
  correctBooleanAnswer: z13.boolean().nullable().optional(),
  explanation: z13.string().trim().max(5e3).nullable().optional(),
  order: z13.number().int().min(1).optional()
}).refine(
  (body) => Object.keys(body).length > 0,
  {
    message: "At least one field is required"
  }
);
var createQuizQuestionValidation = z13.object({
  params: z13.object({
    moduleId: mongoObjectIdSchema5
  }),
  body: createQuizQuestionBodySchema
});
var updateQuizQuestionValidation = z13.object({
  params: z13.object({
    id: mongoObjectIdSchema5
  }),
  body: updateQuizQuestionBodySchema
});
var quizQuestionIdValidation = z13.object({
  params: z13.object({
    id: mongoObjectIdSchema5
  })
});
var quizQuestionModuleValidation = z13.object({
  params: z13.object({
    moduleId: mongoObjectIdSchema5
  })
});

// src/modules/quizeQuestions/quiz.question.route.ts
var router17 = Router17();
router17.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    createQuizQuestionValidation
  ),
  quizQuestionController.createQuizQuestion
);
router17.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  quizQuestionController.getAllQuizQuestions
);
router17.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(
    quizQuestionModuleValidation
  ),
  quizQuestionController.getQuestionsByModule
);
router17.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(
    quizQuestionIdValidation
  ),
  quizQuestionController.getSingleQuizQuestion
);
router17.patch(
  "/:id",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    updateQuizQuestionValidation
  ),
  quizQuestionController.updateQuizQuestion
);
router17.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    quizQuestionIdValidation
  ),
  quizQuestionController.publishQuizQuestion
);
router17.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    quizQuestionIdValidation
  ),
  quizQuestionController.moveQuizQuestionToDraft
);
router17.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    quizQuestionIdValidation
  ),
  quizQuestionController.archiveQuizQuestion
);
var quizQuestionRoutes = router17;

// src/modules/moduleActions/module.action.route.ts
import { Router as Router18 } from "express";

// src/modules/moduleActions/module.action.service.ts
import {
  Types as Types23
} from "mongoose";

// src/modules/moduleActions/module.action.model.schema.ts
import {
  model as model21,
  Schema as Schema21
} from "mongoose";

// src/modules/moduleActions/module.action.interface.ts
var MODULE_ACTION_STATUSES = [
  "draft",
  "published",
  "archived"
];

// src/modules/moduleActions/module.action.model.schema.ts
var moduleActionSchema = new Schema21(
  {
    module: {
      type: Schema21.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5e3
    },
    order: {
      type: Number,
      required: true,
      min: 1
    },
    isRequired: {
      type: Boolean,
      default: true,
      required: true
    },
    pointsReward: {
      type: Number,
      default: 5,
      min: 0
    },
    status: {
      type: String,
      enum: MODULE_ACTION_STATUSES,
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    createdBy: {
      type: Schema21.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema21.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "moduleactions"
  }
);
moduleActionSchema.index(
  {
    module: 1,
    order: 1
  },
  {
    unique: true
  }
);
moduleActionSchema.index({
  module: 1,
  status: 1,
  order: 1
});
moduleActionSchema.index({
  module: 1,
  isRequired: 1,
  status: 1
});
var ModuleAction = model21(
  "ModuleAction",
  moduleActionSchema
);

// src/modules/moduleActions/module.action.service.ts
var throwServiceError11 = (message, statusCode) => {
  const error = new Error(
    message
  );
  error.statusCode = statusCode;
  throw error;
};
var assertFound9 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError11(
      message,
      statusCode
    );
  }
};
var assertValidObjectId5 = (value, fieldName) => {
  if (!Types23.ObjectId.isValid(value)) {
    throwServiceError11(
      `${fieldName} is invalid`,
      400
    );
  }
};
var isAdminOrManager10 = (role) => {
  return role === "admin" || role === "manager";
};
var isDuplicateKeyError3 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var ensureCourseModuleExists4 = async (moduleId) => {
  assertValidObjectId5(
    moduleId,
    "Course module ID"
  );
  const courseModule = await CourseModule.findById(
    moduleId
  );
  assertFound9(
    courseModule,
    "Course module not found",
    404
  );
  if (courseModule.status === "archived") {
    throwServiceError11(
      "Cannot manage actions under an archived course module",
      400
    );
  }
  return courseModule;
};
var createModuleAction = async (moduleId, payload, actorId) => {
  await ensureCourseModuleExists4(
    moduleId
  );
  const existingAction = await ModuleAction.findOne({
    module: moduleId,
    order: payload.order
  });
  if (existingAction) {
    throwServiceError11(
      "Action order already exists in this module",
      409
    );
  }
  const createData = {
    module: new Types23.ObjectId(moduleId),
    title: payload.title,
    order: payload.order,
    isRequired: payload.isRequired ?? true,
    pointsReward: payload.pointsReward ?? 5,
    status: "draft",
    createdBy: new Types23.ObjectId(actorId)
  };
  if (payload.description !== void 0) {
    createData.description = payload.description;
  }
  try {
    const action = await ModuleAction.create(
      createData
    );
    return action.populate([
      {
        path: "module",
        select: "title slug moduleNumber pillar status",
        populate: {
          path: "pillar",
          model: "ChallengePillar",
          select: "name slug title status"
        }
      },
      {
        path: "createdBy",
        select: "fullName email role profileImage"
      }
    ]);
  } catch (error) {
    if (isDuplicateKeyError3(error)) {
      throwServiceError11(
        "Action order already exists in this module",
        409
      );
    }
    throw error;
  }
};
var getAllModuleActions = async ({
  actorRole,
  moduleId,
  includeArchived = false
}) => {
  const filter = {};
  if (moduleId) {
    assertValidObjectId5(
      moduleId,
      "Course module ID"
    );
    filter.module = new Types23.ObjectId(moduleId);
  }
  if (!isAdminOrManager10(actorRole)) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived"
    };
  }
  return ModuleAction.find(filter).sort({
    module: 1,
    order: 1
  }).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title status"
    }
  }).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
};
var getActionsByModule = async (moduleId, actorRole) => {
  assertValidObjectId5(
    moduleId,
    "Course module ID"
  );
  const isPrivileged = isAdminOrManager10(actorRole);
  const moduleFilter = {
    _id: moduleId
  };
  if (!isPrivileged) {
    moduleFilter.status = "published";
  }
  const courseModule = await CourseModule.findOne(
    moduleFilter
  ).populate(
    "pillar",
    "name slug title status"
  );
  assertFound9(
    courseModule,
    "Course module not found or unavailable",
    404
  );
  const actionFilter = {
    module: new Types23.ObjectId(moduleId)
  };
  if (!isPrivileged) {
    actionFilter.status = "published";
  } else {
    actionFilter.status = {
      $ne: "archived"
    };
  }
  const actions = await ModuleAction.find(
    actionFilter
  ).sort({ order: 1 }).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
  return {
    module: courseModule,
    actions
  };
};
var getSingleModuleAction = async (actionId, actorRole) => {
  assertValidObjectId5(
    actionId,
    "Module action ID"
  );
  const filter = {
    _id: actionId
  };
  if (!isAdminOrManager10(actorRole)) {
    filter.status = "published";
  }
  const action = await ModuleAction.findOne(filter).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title status"
    }
  }).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
  assertFound9(
    action,
    "Module action not found",
    404
  );
  return action;
};
var updateModuleAction = async (actionId, payload, actorId) => {
  assertValidObjectId5(
    actionId,
    "Module action ID"
  );
  const action = await ModuleAction.findById(
    actionId
  );
  assertFound9(
    action,
    "Module action not found",
    404
  );
  if (action.status === "archived") {
    throwServiceError11(
      "Archived action cannot be updated",
      400
    );
  }
  if (payload.order !== void 0 && payload.order !== action.order) {
    const duplicateAction = await ModuleAction.findOne({
      _id: {
        $ne: action._id
      },
      module: action.module,
      order: payload.order
    });
    if (duplicateAction) {
      throwServiceError11(
        "Action order already exists in this module",
        409
      );
    }
  }
  if (payload.title !== void 0) {
    action.title = payload.title;
  }
  if (payload.description === null) {
    action.set(
      "description",
      void 0
    );
  } else if (payload.description !== void 0) {
    action.description = payload.description;
  }
  if (payload.order !== void 0) {
    action.order = payload.order;
  }
  if (payload.isRequired !== void 0) {
    action.isRequired = payload.isRequired;
  }
  if (payload.pointsReward !== void 0) {
    action.pointsReward = payload.pointsReward;
  }
  action.updatedBy = new Types23.ObjectId(actorId);
  try {
    await action.save();
  } catch (error) {
    if (isDuplicateKeyError3(error)) {
      throwServiceError11(
        "Action order already exists in this module",
        409
      );
    }
    throw error;
  }
  return action.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title status"
      }
    },
    {
      path: "updatedBy",
      select: "fullName email role profileImage"
    }
  ]);
};
var publishModuleAction = async (actionId, actorId) => {
  assertValidObjectId5(
    actionId,
    "Module action ID"
  );
  const action = await ModuleAction.findById(
    actionId
  );
  assertFound9(
    action,
    "Module action not found",
    404
  );
  if (action.status === "archived") {
    throwServiceError11(
      "Archived action cannot be published",
      400
    );
  }
  const courseModule = await CourseModule.findById(
    action.module
  );
  assertFound9(
    courseModule,
    "Parent course module not found",
    404
  );
  if (courseModule.status !== "published") {
    throwServiceError11(
      "Publish the parent course module before publishing this action",
      400
    );
  }
  action.status = "published";
  action.publishedAt = /* @__PURE__ */ new Date();
  action.set(
    "archivedAt",
    void 0
  );
  action.updatedBy = new Types23.ObjectId(actorId);
  await action.save();
  return action;
};
var moveModuleActionToDraft = async (actionId, actorId) => {
  assertValidObjectId5(
    actionId,
    "Module action ID"
  );
  const action = await ModuleAction.findById(
    actionId
  );
  assertFound9(
    action,
    "Module action not found",
    404
  );
  if (action.status === "archived") {
    throwServiceError11(
      "Archived action cannot be moved to draft",
      400
    );
  }
  action.status = "draft";
  action.set(
    "publishedAt",
    void 0
  );
  action.updatedBy = new Types23.ObjectId(actorId);
  await action.save();
  return action;
};
var archiveModuleAction = async (actionId, actorId) => {
  assertValidObjectId5(
    actionId,
    "Module action ID"
  );
  const action = await ModuleAction.findById(
    actionId
  );
  assertFound9(
    action,
    "Module action not found",
    404
  );
  action.status = "archived";
  action.archivedAt = /* @__PURE__ */ new Date();
  action.set(
    "publishedAt",
    void 0
  );
  action.updatedBy = new Types23.ObjectId(actorId);
  await action.save();
  return action;
};
var moduleActionService = {
  createModuleAction,
  getAllModuleActions,
  getActionsByModule,
  getSingleModuleAction,
  updateModuleAction,
  publishModuleAction,
  moveModuleActionToDraft,
  archiveModuleAction
};

// src/modules/moduleActions/module.action.controller.ts
var throwControllerError4 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var getAuthUser8 = (req) => {
  const user = req.user;
  if (!user) {
    return throwControllerError4("Authentication required", 401);
  }
  return {
    id: user.id,
    role: user.role
  };
};
var createModuleAction2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const result = await moduleActionService.createModuleAction(
      String(
        req.params.moduleId
      ),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Module action created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllModuleActions2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const moduleId = typeof req.query.moduleId === "string" ? req.query.moduleId : void 0;
    const result = await moduleActionService.getAllModuleActions({
      actorRole: authUser.role,
      ...moduleId !== void 0 ? { moduleId } : {},
      includeArchived: req.query.includeArchived === "true"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module actions retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getActionsByModule2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const result = await moduleActionService.getActionsByModule(
      String(
        req.params.moduleId
      ),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module actions retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleModuleAction2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const result = await moduleActionService.getSingleModuleAction(
      String(req.params.id),
      authUser.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module action retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateModuleAction2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const result = await moduleActionService.updateModuleAction(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module action updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var publishModuleAction2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const result = await moduleActionService.publishModuleAction(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module action published successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moveModuleActionToDraft2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const result = await moduleActionService.moveModuleActionToDraft(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module action moved to draft successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var archiveModuleAction2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser8(req);
    const result = await moduleActionService.archiveModuleAction(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module action archived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moduleActionController = {
  createModuleAction: createModuleAction2,
  getAllModuleActions: getAllModuleActions2,
  getActionsByModule: getActionsByModule2,
  getSingleModuleAction: getSingleModuleAction2,
  updateModuleAction: updateModuleAction2,
  publishModuleAction: publishModuleAction2,
  moveModuleActionToDraft: moveModuleActionToDraft2,
  archiveModuleAction: archiveModuleAction2
};

// src/modules/moduleActions/module.action.validation.ts
import { z as z14 } from "zod";
var mongoObjectIdSchema6 = z14.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid MongoDB ObjectId"
);
var createModuleActionBodySchema = z14.object({
  title: z14.string().trim().min(2).max(300),
  description: z14.string().trim().max(5e3).optional(),
  order: z14.number().int().min(1),
  isRequired: z14.boolean().default(true),
  pointsReward: z14.number().int().nonnegative().max(1e3).default(5)
});
var updateModuleActionBodySchema = z14.object({
  title: z14.string().trim().min(2).max(300).optional(),
  description: z14.string().trim().max(5e3).nullable().optional(),
  order: z14.number().int().min(1).optional(),
  isRequired: z14.boolean().optional(),
  pointsReward: z14.number().int().nonnegative().max(1e3).optional()
}).refine(
  (body) => Object.keys(body).length > 0,
  {
    message: "At least one field is required"
  }
);
var createModuleActionValidation = z14.object({
  params: z14.object({
    moduleId: mongoObjectIdSchema6
  }),
  body: createModuleActionBodySchema
});
var updateModuleActionValidation = z14.object({
  params: z14.object({
    id: mongoObjectIdSchema6
  }),
  body: updateModuleActionBodySchema
});
var moduleActionIdValidation = z14.object({
  params: z14.object({
    id: mongoObjectIdSchema6
  })
});
var moduleActionModuleValidation = z14.object({
  params: z14.object({
    moduleId: mongoObjectIdSchema6
  })
});

// src/modules/moduleActions/module.action.route.ts
var router18 = Router18();
router18.post(
  "/module/:moduleId",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    createModuleActionValidation
  ),
  moduleActionController.createModuleAction
);
router18.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  moduleActionController.getAllModuleActions
);
router18.get(
  "/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(
    moduleActionModuleValidation
  ),
  moduleActionController.getActionsByModule
);
router18.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(
    moduleActionIdValidation
  ),
  moduleActionController.getSingleModuleAction
);
router18.patch(
  "/:id",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    updateModuleActionValidation
  ),
  moduleActionController.updateModuleAction
);
router18.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    moduleActionIdValidation
  ),
  moduleActionController.publishModuleAction
);
router18.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    moduleActionIdValidation
  ),
  moduleActionController.moveModuleActionToDraft
);
router18.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    moduleActionIdValidation
  ),
  moduleActionController.archiveModuleAction
);
var moduleActionRoutes = router18;

// src/modules/room/room.route.ts
import { Router as Router19 } from "express";

// src/utility/country.ts
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
countries.registerLocale(enLocale);
var resolveCountry = (rawName) => {
  if (!rawName) return null;
  const trimmed = rawName.trim();
  const code = countries.getAlpha2Code(trimmed, "en");
  if (!code) return null;
  return {
    code: code.toUpperCase(),
    name: countries.getName(code, "en")
    // canonical spelling
  };
};

// src/modules/room/room.modal.ts
import { Schema as Schema22, model as model22 } from "mongoose";
var roomSchema = new Schema22(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    members: [
      {
        type: Schema22.Types.ObjectId,
        ref: "User"
      }
    ],
    createdBy: {
      type: Schema22.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["general", "country"],
      default: "general"
    },
    countryName: String,
    countryCode: { type: String, unique: true, sparse: true }
  },
  {
    timestamps: true
  }
);
var Room = model22("Room", roomSchema);

// src/modules/room/room.service.ts
var getGeneralRoom = async (createdBy) => {
  return Room.findOneAndUpdate(
    { type: "general" },
    {
      $setOnInsert: {
        name: "General Community",
        createdBy,
        type: "general"
      }
    },
    { upsert: true, new: true }
  );
};
var getOrCreateCountryRoom = async (countryName, createdBy) => {
  const country = resolveCountry(countryName);
  if (!country) {
    throw new Error("Invalid country name");
  }
  return Room.findOneAndUpdate(
    { countryCode: country.code, type: "country" },
    {
      $setOnInsert: {
        name: `${country.name} Community`,
        createdBy,
        countryCode: country.code,
        countryName: country.name,
        type: "country"
      }
    },
    { upsert: true, new: true }
  );
};

// src/modules/room/room.controller.ts
var getGeneralRoomHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    const room = await getGeneralRoom(userId);
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};
var getCountryRoomHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    const canChooseAnyRoom = req.user?.role === "founder" || req.user?.role === "admin" || req.user?.role === "manager";
    const countryName = req.query.countryName;
    if (typeof countryName !== "string" || !countryName.trim()) {
      res.status(400).json({
        success: false,
        message: "countryName query parameter is required"
      });
      return;
    }
    if (!canChooseAnyRoom) {
      const userDoc = await User.findById(userId).select("country");
      const userCountry = resolveCountry(userDoc?.country);
      const requestedCountry = resolveCountry(countryName);
      if (!userCountry || !requestedCountry || userCountry.code !== requestedCountry.code) {
        res.status(403).json({
          success: false,
          message: "You can only access your own country room"
        });
        return;
      }
    }
    const room = await getOrCreateCountryRoom(
      countryName,
      userId
    );
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// src/modules/room/room.route.ts
var router19 = Router19();
router19.get("/general", verifyToken, getGeneralRoomHandler);
router19.get("/country", verifyToken, getCountryRoomHandler);
var room_route_default = router19;

// src/modules/message/message.route.ts
import { Router as Router20 } from "express";

// src/modules/message/message.services.ts
import { Types as Types24 } from "mongoose";

// src/modules/message/message.model.ts
import { Schema as Schema23, model as model23 } from "mongoose";
var messageSchema = new Schema23(
  {
    room: {
      type: Schema23.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true
    },
    sender: {
      type: Schema23.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2e3
    },
    // NEW: reply support
    replyTo: {
      type: Schema23.Types.ObjectId,
      ref: "Message",
      default: null
    },
    // NEW: soft delete support
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);
var Message = model23("Message", messageSchema);

// src/modules/message/message.services.ts
var getMessageHistory = async (roomId, page, limit) => {
  const skip = (page - 1) * limit;
  const messages = await Message.find({ room: roomId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("sender", "fullName profileImage").populate({
    path: "replyTo",
    select: "content sender isDeleted",
    populate: { path: "sender", select: "fullName" }
  }).lean();
  return messages.reverse();
};
var createMessage = async (roomId, senderId, content, replyTo) => {
  if (replyTo) {
    const parent = await Message.findOne({ _id: replyTo, room: roomId });
    if (!parent) {
      throw new Error("Message you're replying to no longer exists in this room");
    }
  }
  const message = await Message.create({
    room: roomId,
    sender: senderId,
    content,
    replyTo: replyTo || null
  });
  return message.populate([
    { path: "sender", select: "fullName profileImage" },
    {
      path: "replyTo",
      select: "content sender isDeleted",
      populate: { path: "sender", select: "fullName" }
    }
  ]);
};
var deleteMessage = async (messageId, userId) => {
  if (!Types24.ObjectId.isValid(messageId)) {
    throw new Error("Invalid message id");
  }
  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }
  message.isDeleted = true;
  message.deletedAt = /* @__PURE__ */ new Date();
  message.content = "This message was deleted";
  await message.save();
  return message;
};

// src/modules/message/message.controller.ts
var getMessageHistoryHandler = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const messages = await getMessageHistory(roomId, page, limit);
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// src/modules/message/message.route.ts
var router20 = Router20();
router20.get("/:roomId", verifyToken, getMessageHistoryHandler);
router20.get("/", (req, res) => {
  res.send("room route is working as expected");
});
var message_route_default = router20;

// src/modules/manageLogo/logo.route.ts
import { Router as Router21 } from "express";

// src/modules/manageLogo/logo.model.schema.ts
import { model as model24, Schema as Schema24 } from "mongoose";
var logoSchema = new Schema24(
  {
    logo: {
      type: String,
      required: true,
      trim: true
    }
  }
);
var logo = model24("logo", logoSchema);

// src/modules/manageLogo/logo.service.ts
var uploadLogoIntoDB = async (userId, file) => {
  const profileImageUrl = await uploadLogoToCloudinary(file, "adam/logo");
  const existingLogo = await logo.findOne();
  if (existingLogo) {
    existingLogo.logo = profileImageUrl;
    await existingLogo.save();
    return existingLogo;
  }
  const result = await logo.create({ logo: profileImageUrl });
  return result;
};
var getLogoFromDB = async () => {
  const result = await logo.findOne();
  if (!result) {
    throw new NotFoundError("Logo not found");
  }
  return result;
};
var changeLogoIntoDB = async (userId, file) => {
  const profileImageUrl = await uploadLogoToCloudinary(file, "adam/logo");
  const existingLogo = await logo.findOne();
  if (!existingLogo) {
    const result = await logo.create({ logo: profileImageUrl });
    return result;
  }
  existingLogo.logo = profileImageUrl;
  await existingLogo.save();
  return existingLogo;
};
var logoService = { uploadLogoIntoDB, getLogoFromDB, changeLogoIntoDB };

// src/modules/manageLogo/logo.controller.ts
var throwError8 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var getAuthenticatedUserId2 = (req) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  if (typeof req.user.id !== "string") {
    throw new UnauthorizedError("Invalid authenticated user");
  }
  return req.user.id;
};
var logoUpload = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId2(req);
    const file = req.file;
    if (!file) {
      throwError8("Logo image is required", 400);
    }
    const result = await logoService.uploadLogoIntoDB(userId, file);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Logo uploaded successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getLogo = async (req, res, next) => {
  try {
    const result = await logoService.getLogoFromDB();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Logo retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var changeLogo = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId2(req);
    const file = req.file;
    if (!file) {
      throwError8("Logo image is required", 400);
    }
    const result = await logoService.changeLogoIntoDB(userId, file);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Logo changed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var logoController = { logoUpload, getLogo, changeLogo };

// src/modules/manageLogo/logo.route.ts
var router21 = Router21();
router21.get("/", logoController.getLogo);
router21.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager"),
  upload.single("logo"),
  logoController.logoUpload
);
router21.patch(
  "/change",
  verifyToken,
  authorizeRoles("founder", "manager"),
  upload.single("logo"),
  logoController.changeLogo
);
var LogoRoutes = router21;

// src/modules/academyProfiles/academy.profile.route.ts
import { Router as Router22 } from "express";

// src/modules/academyProfiles/academy.profile.service.ts
import { Types as Types25 } from "mongoose";

// src/modules/academyProfiles/academy.profile.model.schema.ts
import { Schema as Schema25, model as model25 } from "mongoose";
var AcademyProfileSchema = new Schema25(
  {
    user: {
      type: Schema25.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    mentor: {
      type: Schema25.Types.ObjectId,
      ref: "User"
    },
    currentPillar: {
      type: Schema25.Types.ObjectId,
      ref: "ChallengePillar"
    },
    academyName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"]
    },
    goals: [
      {
        type: String,
        trim: true
      }
    ],
    totalPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);
var AcademyProfile = model25(
  "AcademyProfile",
  AcademyProfileSchema
);

// src/modules/academyProfiles/academy.profile.service.ts
var throwServiceError12 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
function assertFound10(value, message, statusCode) {
  if (value === null || value === void 0) {
    throwServiceError12(message, statusCode);
  }
}
var createProfile = async (userId, payload) => {
  const existing = await AcademyProfile.findOne({
    user: userId
  });
  if (existing) {
    throwServiceError12("Academy profile already exists", 409);
  }
  const profile = await AcademyProfile.create({
    user: new Types25.ObjectId(userId),
    ...payload
  });
  return profile;
};
var getMyProfile2 = async (userId) => {
  const filter = {
    user: new Types25.ObjectId(userId)
  };
  const profile = await AcademyProfile.findOne(filter).populate("currentPillar", "name slug title").populate("mentor", "fullName email profileImage");
  assertFound10(profile, "Academy profile not found", 404);
  return profile;
};
var updateProfile = async (userId, payload) => {
  const profile = await AcademyProfile.findOne({
    user: new Types25.ObjectId(userId)
  });
  assertFound10(profile, "Academy profile not found", 404);
  if (payload.academyName !== void 0)
    profile.academyName = payload.academyName;
  if (payload.bio !== void 0) profile.bio = payload.bio;
  if (payload.goals !== void 0) profile.goals = payload.goals;
  if (payload.experienceLevel !== void 0)
    profile.experienceLevel = payload.experienceLevel;
  if (payload.notificationPreferences !== void 0) {
    profile.notificationPreferences = {
      ...profile.notificationPreferences,
      ...payload.notificationPreferences
    };
  }
  await profile.save();
  return profile;
};
var getAllProfiles = async () => {
  return AcademyProfile.find().populate("user", "fullName email role profileImage").populate("mentor", "fullName email").populate("currentPillar", "title slug");
};
var academyProfileService = {
  createProfile,
  getMyProfile: getMyProfile2,
  updateProfile,
  getAllProfiles
};

// src/modules/academyProfiles/academy.profile.controller.ts
var getAuthUser9 = (req) => {
  if (!req.user) throw new Error("Authentication required");
  return req.user;
};
var createProfile2 = async (req, res, next) => {
  try {
    const user = getAuthUser9(req);
    const result = await academyProfileService.createProfile(
      user.id,
      req.body
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Academy profile created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyProfile3 = async (req, res, next) => {
  try {
    const user = getAuthUser9(req);
    const result = await academyProfileService.getMyProfile(user.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Academy profile retrieved",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateProfile2 = async (req, res, next) => {
  try {
    const user = getAuthUser9(req);
    const result = await academyProfileService.updateProfile(
      user.id,
      req.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Academy profile updated",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllProfiles2 = async (req, res, next) => {
  try {
    const result = await academyProfileService.getAllProfiles();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Profiles retrieved",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var academyProfileController = {
  createProfile: createProfile2,
  getMyProfile: getMyProfile3,
  updateProfile: updateProfile2,
  getAllProfiles: getAllProfiles2
};

// src/modules/academyProfiles/academy.profile.route.ts
var router22 = Router22();
router22.post("/", verifyToken, academyProfileController.createProfile);
router22.get("/me", verifyToken, academyProfileController.getMyProfile);
router22.patch("/me", verifyToken, academyProfileController.updateProfile);
router22.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  academyProfileController.getAllProfiles
);
var academyProfileRoutes = router22;

// src/modules/userEntitlements/userEntitlements.route.ts
import { Router as Router23 } from "express";

// src/modules/userEntitlements/userEntitlements.controller.ts
var throwControllerError5 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var assertFound11 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwControllerError5(message, statusCode);
  }
};
var getAuthUser10 = (req) => {
  const user = req.user;
  assertFound11(user, "Authentication required", 401);
  return {
    id: user.id,
    role: user.role
  };
};
var grantEntitlement = async (req, res, next) => {
  try {
    const authUser = getAuthUser10(req);
    const result = await userEntitlementService.grantEntitlementByAdmin(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User entitlement granted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyEntitlements2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser10(req);
    const result = await userEntitlementService.getMyEntitlements(authUser.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Your entitlements retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var checkPillarAccess2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser10(req);
    const result = await userEntitlementService.checkPillarAccess(
      authUser.id,
      String(req.params.pillarId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: result.hasAccess ? "Pillar access granted" : "Pillar purchase is required",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllEntitlements2 = async (req, res, next) => {
  try {
    const options2 = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    };
    if (typeof req.query.userId === "string") {
      options2.userId = req.query.userId;
    }
    if (typeof req.query.pillarId === "string") {
      options2.pillarId = req.query.pillarId;
    }
    if (typeof req.query.entitlementType === "string") {
      options2.entitlementType = req.query.entitlementType;
    }
    if (typeof req.query.source === "string") {
      options2.source = req.query.source;
    }
    if (typeof req.query.status === "string") {
      options2.status = req.query.status;
    }
    const result = await userEntitlementService.getAllEntitlements(options2);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User entitlements retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleEntitlement2 = async (req, res, next) => {
  try {
    const result = await userEntitlementService.getSingleEntitlement(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var revokeEntitlement2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser10(req);
    const result = await userEntitlementService.revokeEntitlement(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement revoked successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var refundEntitlement2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser10(req);
    const result = await userEntitlementService.refundEntitlement(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement marked as refunded",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var expireEntitlement2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser10(req);
    const result = await userEntitlementService.expireEntitlement(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement expired successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var reactivateEntitlement2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser10(req);
    const result = await userEntitlementService.reactivateEntitlement(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement reactivated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var userEntitlementController = {
  grantEntitlement,
  getMyEntitlements: getMyEntitlements2,
  checkPillarAccess: checkPillarAccess2,
  getAllEntitlements: getAllEntitlements2,
  getSingleEntitlement: getSingleEntitlement2,
  revokeEntitlement: revokeEntitlement2,
  refundEntitlement: refundEntitlement2,
  expireEntitlement: expireEntitlement2,
  reactivateEntitlement: reactivateEntitlement2
};

// src/modules/userEntitlements/userEntitlements.validation.ts
import { z as z15 } from "zod";
var mongoObjectIdSchema7 = z15.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var optionalDateSchema = z15.string().datetime({
  message: "Date must be a valid ISO datetime"
}).optional();
var nullableDateSchema = z15.string().datetime({
  message: "Date must be a valid ISO datetime"
}).nullable().optional();
var validateEntitlementTarget = (data, context) => {
  const type = data.entitlementType ?? "pillar";
  if (type === "pillar") {
    if (!data.pillar) {
      context.addIssue({
        code: z15.ZodIssueCode.custom,
        path: ["pillar"],
        message: "Pillar is required for pillar entitlement"
      });
    }
    if (data.targetId) {
      context.addIssue({
        code: z15.ZodIssueCode.custom,
        path: ["targetId"],
        message: "targetId is not allowed for pillar entitlement"
      });
    }
    return;
  }
  if (!data.targetId) {
    context.addIssue({
      code: z15.ZodIssueCode.custom,
      path: ["targetId"],
      message: "targetId is required for bundle, event or retreat entitlement"
    });
  }
  if (data.pillar) {
    context.addIssue({
      code: z15.ZodIssueCode.custom,
      path: ["pillar"],
      message: "Pillar is only allowed for pillar entitlement"
    });
  }
};
var validateDates = (data, context) => {
  if (!data.expiresAt) {
    return;
  }
  const startsAt = data.startsAt ? new Date(data.startsAt) : /* @__PURE__ */ new Date();
  const expiresAt = new Date(data.expiresAt);
  if (expiresAt <= startsAt) {
    context.addIssue({
      code: z15.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "expiresAt must be later than startsAt"
    });
  }
};
var grantEntitlementBodySchema = z15.object({
  user: mongoObjectIdSchema7,
  entitlementType: z15.enum(ENTITLEMENT_TYPES).default("pillar"),
  pillar: mongoObjectIdSchema7.optional(),
  targetId: mongoObjectIdSchema7.optional(),
  source: z15.enum(ADMIN_ENTITLEMENT_SOURCES).default("admin"),
  paymentSession: mongoObjectIdSchema7.optional(),
  startsAt: optionalDateSchema,
  expiresAt: nullableDateSchema
}).superRefine((data, context) => {
  validateEntitlementTarget(data, context);
  validateDates(data, context);
});
var reactivateBodySchema = z15.object({
  source: z15.enum(ADMIN_ENTITLEMENT_SOURCES).default("admin"),
  startsAt: optionalDateSchema,
  expiresAt: nullableDateSchema
}).superRefine((data, context) => {
  validateDates(data, context);
});
var statusReasonBodySchema = z15.object({
  reason: z15.string().trim().max(1e3).optional()
});
var grantUserEntitlementValidation = z15.object({
  body: grantEntitlementBodySchema
});
var entitlementIdValidation = z15.object({
  params: z15.object({
    id: mongoObjectIdSchema7
  })
});
var pillarAccessValidation = z15.object({
  params: z15.object({
    pillarId: mongoObjectIdSchema7
  })
});
var entitlementStatusValidation = z15.object({
  params: z15.object({
    id: mongoObjectIdSchema7
  }),
  body: statusReasonBodySchema
});
var reactivateEntitlementValidation = z15.object({
  params: z15.object({
    id: mongoObjectIdSchema7
  }),
  body: reactivateBodySchema
});
var getAllEntitlementsValidation = z15.object({
  query: z15.object({
    userId: mongoObjectIdSchema7.optional(),
    pillarId: mongoObjectIdSchema7.optional(),
    entitlementType: z15.enum(ENTITLEMENT_TYPES).optional(),
    source: z15.enum(ENTITLEMENT_SOURCES).optional(),
    status: z15.enum(ENTITLEMENT_STATUSES).optional(),
    page: z15.coerce.number().int().min(1).optional(),
    limit: z15.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/userEntitlements/userEntitlements.route.ts
var router23 = Router23();
router23.post(
  "/grant",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(grantUserEntitlementValidation),
  userEntitlementController.grantEntitlement
);
router23.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  userEntitlementController.getMyEntitlements
);
router23.get(
  "/check/pillar/:pillarId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(pillarAccessValidation),
  userEntitlementController.checkPillarAccess
);
router23.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(getAllEntitlementsValidation),
  userEntitlementController.getAllEntitlements
);
router23.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(entitlementIdValidation),
  userEntitlementController.getSingleEntitlement
);
router23.patch(
  "/:id/revoke",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(entitlementStatusValidation),
  userEntitlementController.revokeEntitlement
);
router23.patch(
  "/:id/refund",
  verifyToken,
  authorizeRoles("admin"),
  validateRequest_default(entitlementStatusValidation),
  userEntitlementController.refundEntitlement
);
router23.patch(
  "/:id/expire",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(entitlementStatusValidation),
  userEntitlementController.expireEntitlement
);
router23.patch(
  "/:id/reactivate",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(reactivateEntitlementValidation),
  userEntitlementController.reactivateEntitlement
);
var userEntitlementRoutes = router23;

// src/modules/videoProgress/video.progress.route.ts
import { Router as Router24 } from "express";

// src/modules/videoProgress/video.progress.service.ts
import { Types as Types26 } from "mongoose";

// src/modules/videoProgress/video.progress.model.schema.ts
import { model as model26, Schema as Schema26 } from "mongoose";
var watchedRangeSchema = new Schema26(
  {
    startSeconds: {
      type: Number,
      required: true,
      min: 0
    },
    endSeconds: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);
var videoProgressSchema = new Schema26(
  {
    user: {
      type: Schema26.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    video: {
      type: Schema26.Types.ObjectId,
      ref: "ModuleVideo",
      required: true,
      index: true
    },
    module: {
      type: Schema26.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    durationSecondsSnapshot: {
      type: Number,
      required: true,
      min: 0
    },
    requiredWatchPercentSnapshot: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    watchedRanges: {
      type: [watchedRangeSchema],
      default: []
    },
    totalWatchedSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    watchPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastPositionSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: "videoprogress",
    /**
     * Prevent silent concurrent overwrites.
     */
    optimisticConcurrency: true
  }
);
videoProgressSchema.index(
  {
    user: 1,
    video: 1
  },
  {
    unique: true
  }
);
videoProgressSchema.index({
  user: 1,
  module: 1,
  isCompleted: 1
});
videoProgressSchema.index({
  module: 1,
  isCompleted: 1,
  updatedAt: -1
});
videoProgressSchema.index({
  user: 1,
  lastWatchedAt: -1
});
var VideoProgress = model26(
  "VideoProgress",
  videoProgressSchema
);

// src/modules/videoProgress/video.progress.service.ts
var MAX_HEARTBEAT_SEGMENT_SECONDS = 60;
var VIDEO_DURATION_TOLERANCE_SECONDS = 5;
var RANGE_MERGE_TOLERANCE_SECONDS = 0.5;
var assertValidObjectId6 = (value, fieldName) => {
  if (!Types26.ObjectId.isValid(value)) {
    throwServiceError_default(`${fieldName} is invalid`, 400);
  }
};
var isDuplicateKeyError4 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var roundToTwoDecimalPlaces = (value) => {
  return Math.round(value * 100) / 100;
};
var clamp = (value, minimum, maximum) => {
  return Math.min(Math.max(value, minimum), maximum);
};
var mergeWatchedRanges = (existingRanges, newRange) => {
  const sortedRanges = [
    ...existingRanges.map((range) => ({
      startSeconds: range.startSeconds,
      endSeconds: range.endSeconds
    })),
    {
      startSeconds: newRange.startSeconds,
      endSeconds: newRange.endSeconds
    }
  ].sort((first, second) => first.startSeconds - second.startSeconds);
  const mergedRanges = [];
  for (const range of sortedRanges) {
    const lastRange = mergedRanges[mergedRanges.length - 1];
    if (!lastRange) {
      mergedRanges.push({
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds
      });
      continue;
    }
    const touchesOrOverlaps = range.startSeconds <= lastRange.endSeconds + RANGE_MERGE_TOLERANCE_SECONDS;
    if (touchesOrOverlaps) {
      lastRange.endSeconds = Math.max(lastRange.endSeconds, range.endSeconds);
    } else {
      mergedRanges.push({
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds
      });
    }
  }
  return mergedRanges;
};
var calculateTotalWatchedSeconds = (watchedRanges) => {
  const total = watchedRanges.reduce((sum, range) => {
    return sum + Math.max(0, range.endSeconds - range.startSeconds);
  }, 0);
  return roundToTwoDecimalPlaces(total);
};
var calculateWatchPercent = (totalWatchedSeconds, durationSeconds) => {
  if (durationSeconds <= 0) {
    return 0;
  }
  return Math.min(
    100,
    roundToTwoDecimalPlaces(totalWatchedSeconds / durationSeconds * 100)
  );
};
var ensureVideoIsAvailable = async (videoId) => {
  assertValidObjectId6(videoId, "Module video ID");
  const video = await ModuleVideo.findById(videoId).select(
    [
      "_id",
      "module",
      "title",
      "slug",
      "thumbnailUrl",
      "durationSeconds",
      "requiredWatchPercent",
      "isRequired",
      "isPaid",
      "order",
      "uploadStatus",
      "status"
    ].join(" ")
  );
  assertFound_default(video, "Module video not found", 404);
  if (video.status !== "published") {
    throwServiceError_default("Module video is not published", 403);
  }
  if (video.uploadStatus !== "ready") {
    throwServiceError_default("Module video is not ready", 403);
  }
  if (video.durationSeconds <= 0) {
    throwServiceError_default("Module video duration is invalid", 400);
  }
  const courseModule = await CourseModule.findById(video.module).select(
    ["_id", "pillar", "title", "slug", "moduleNumber", "status"].join(" ")
  );
  assertFound_default(courseModule, "Parent course module not found", 404);
  if (courseModule.status !== "published") {
    throwServiceError_default("Parent course module is not published", 403);
  }
  return {
    video,
    courseModule
  };
};
var validateHeartbeatAgainstVideo = (payload, durationSeconds) => {
  if (payload.segmentEndSeconds <= payload.segmentStartSeconds) {
    throwServiceError_default("Segment end must be greater than segment start", 400);
  }
  const segmentLength = payload.segmentEndSeconds - payload.segmentStartSeconds;
  if (segmentLength > MAX_HEARTBEAT_SEGMENT_SECONDS) {
    throwServiceError_default(
      `A heartbeat segment cannot exceed ${MAX_HEARTBEAT_SEGMENT_SECONDS} seconds`,
      400
    );
  }
  if (payload.segmentStartSeconds > durationSeconds + VIDEO_DURATION_TOLERANCE_SECONDS || payload.segmentEndSeconds > durationSeconds + VIDEO_DURATION_TOLERANCE_SECONDS || payload.currentPositionSeconds > durationSeconds + VIDEO_DURATION_TOLERANCE_SECONDS) {
    throwServiceError_default("Heartbeat position exceeds video duration", 400);
  }
  const startSeconds = clamp(payload.segmentStartSeconds, 0, durationSeconds);
  const endSeconds = clamp(payload.segmentEndSeconds, 0, durationSeconds);
  if (endSeconds <= startSeconds) {
    throwServiceError_default("Heartbeat contains no valid watched duration", 400);
  }
  return {
    startSeconds,
    endSeconds
  };
};
var populateVideoProgress = async (progress) => {
  return progress.populate([
    {
      path: "video",
      select: [
        "title",
        "slug",
        "thumbnailUrl",
        "durationSeconds",
        "requiredWatchPercent",
        "isRequired",
        "isPaid",
        "order",
        "status"
      ].join(" ")
    },
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title status"
      }
    }
  ]);
};
var recordVideoHeartbeat = async (userId, videoId, payload) => {
  assertValidObjectId6(userId, "User ID");
  const { video, courseModule } = await ensureVideoIsAvailable(videoId);
  const durationSeconds = video.durationSeconds;
  const requiredWatchPercent = video.requiredWatchPercent ?? 80;
  const newWatchedRange = validateHeartbeatAgainstVideo(
    payload,
    durationSeconds
  );
  const progressFilter = {
    user: new Types26.ObjectId(userId),
    video: new Types26.ObjectId(videoId)
  };
  let progress = await VideoProgress.findOne(progressFilter);
  const now = /* @__PURE__ */ new Date();
  if (!progress) {
    const watchedRanges = mergeWatchedRanges([], newWatchedRange);
    const totalWatchedSeconds2 = calculateTotalWatchedSeconds(watchedRanges);
    const watchPercent2 = calculateWatchPercent(
      totalWatchedSeconds2,
      durationSeconds
    );
    const isCompleted = watchPercent2 >= requiredWatchPercent;
    const createData = {
      user: new Types26.ObjectId(userId),
      video: new Types26.ObjectId(videoId),
      module: courseModule._id,
      durationSecondsSnapshot: durationSeconds,
      requiredWatchPercentSnapshot: requiredWatchPercent,
      watchedRanges,
      totalWatchedSeconds: totalWatchedSeconds2,
      watchPercent: watchPercent2,
      lastPositionSeconds: clamp(
        payload.currentPositionSeconds,
        0,
        durationSeconds
      ),
      isCompleted,
      startedAt: now,
      lastWatchedAt: now
    };
    if (isCompleted) {
      createData.completedAt = now;
    }
    try {
      progress = await VideoProgress.create(createData);
      return populateVideoProgress(progress);
    } catch (error) {
      if (!isDuplicateKeyError4(error)) {
        throw error;
      }
      progress = await VideoProgress.findOne(progressFilter);
      assertFound_default(progress, "Video progress could not be created", 500);
    }
  }
  const currentRanges = progress.watchedRanges.map((range) => ({
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds
  }));
  const mergedRanges = mergeWatchedRanges(currentRanges, newWatchedRange);
  const totalWatchedSeconds = calculateTotalWatchedSeconds(mergedRanges);
  const watchPercent = calculateWatchPercent(
    totalWatchedSeconds,
    durationSeconds
  );
  const reachedCompletion = watchPercent >= requiredWatchPercent;
  const newlyCompleted = !progress.isCompleted && reachedCompletion;
  progress.module = courseModule._id;
  progress.durationSecondsSnapshot = durationSeconds;
  progress.requiredWatchPercentSnapshot = requiredWatchPercent;
  progress.set("watchedRanges", mergedRanges);
  progress.totalWatchedSeconds = totalWatchedSeconds;
  progress.watchPercent = watchPercent;
  progress.lastPositionSeconds = clamp(
    payload.currentPositionSeconds,
    0,
    durationSeconds
  );
  progress.lastWatchedAt = now;
  progress.isCompleted = progress.isCompleted || reachedCompletion;
  if (newlyCompleted) {
    progress.completedAt = now;
  }
  await progress.save();
  return populateVideoProgress(progress);
};
var getMyVideoProgress = async (userId, videoId) => {
  assertValidObjectId6(userId, "User ID");
  const { video, courseModule } = await ensureVideoIsAvailable(videoId);
  const filter = {
    user: new Types26.ObjectId(userId),
    video: new Types26.ObjectId(videoId)
  };
  const progress = await VideoProgress.findOne(filter);
  return {
    video: {
      id: video._id,
      title: video.title,
      slug: video.slug,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      requiredWatchPercent: video.requiredWatchPercent,
      isRequired: video.isRequired,
      isPaid: video.isPaid,
      order: video.order
    },
    module: {
      id: courseModule._id,
      title: courseModule.title,
      slug: courseModule.slug,
      moduleNumber: courseModule.moduleNumber,
      pillar: courseModule.pillar
    },
    progress: progress ? {
      id: progress._id,
      totalWatchedSeconds: progress.totalWatchedSeconds,
      watchPercent: progress.watchPercent,
      lastPositionSeconds: progress.lastPositionSeconds,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
      lastWatchedAt: progress.lastWatchedAt
    } : {
      id: null,
      totalWatchedSeconds: 0,
      watchPercent: 0,
      lastPositionSeconds: 0,
      isCompleted: false,
      completedAt: null,
      lastWatchedAt: null
    }
  };
};
var getMyModuleVideoProgress = async (userId, moduleId) => {
  assertValidObjectId6(userId, "User ID");
  assertValidObjectId6(moduleId, "Course module ID");
  const courseModule = await CourseModule.findById(moduleId).select(
    [
      "_id",
      "pillar",
      "title",
      "slug",
      "moduleNumber",
      "minimumVideoPercent",
      "status"
    ].join(" ")
  ).populate("pillar", "name slug title status");
  assertFound_default(courseModule, "Course module not found", 404);
  if (courseModule.status !== "published") {
    throwServiceError_default("Course module is not published", 403);
  }
  const videos = await ModuleVideo.find({
    module: new Types26.ObjectId(moduleId),
    status: "published"
  }).select(
    [
      "_id",
      "title",
      "slug",
      "thumbnailUrl",
      "durationSeconds",
      "requiredWatchPercent",
      "isRequired",
      "isPaid",
      "pointsReward",
      "order"
    ].join(" ")
  ).sort({ order: 1 }).lean();
  const videoIds = videos.map((video) => video._id);
  const progressFilter = {
    user: new Types26.ObjectId(userId),
    module: new Types26.ObjectId(moduleId),
    video: {
      $in: videoIds
    }
  };
  const progressDocuments = videoIds.length > 0 ? await VideoProgress.find(progressFilter).lean() : [];
  const progressByVideoId = new Map(
    progressDocuments.map((progress) => [progress.video.toString(), progress])
  );
  const videosWithProgress = videos.map((video) => {
    const progress = progressByVideoId.get(video._id.toString());
    return {
      ...video,
      progress: progress ? {
        totalWatchedSeconds: progress.totalWatchedSeconds,
        watchPercent: progress.watchPercent,
        lastPositionSeconds: progress.lastPositionSeconds,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        lastWatchedAt: progress.lastWatchedAt
      } : {
        totalWatchedSeconds: 0,
        watchPercent: 0,
        lastPositionSeconds: 0,
        isCompleted: false,
        completedAt: null,
        lastWatchedAt: null
      }
    };
  });
  const requiredVideos = videosWithProgress.filter((video) => video.isRequired);
  const completedRequiredVideos = requiredVideos.filter(
    (video) => video.progress.isCompleted
  ).length;
  const requiredVideoCompletionPercent = requiredVideos.length === 0 ? 100 : roundToTwoDecimalPlaces(
    completedRequiredVideos / requiredVideos.length * 100
  );
  const allRequiredVideosCompleted = requiredVideos.length === 0 || completedRequiredVideos === requiredVideos.length;
  return {
    module: courseModule,
    summary: {
      totalVideos: videos.length,
      totalRequiredVideos: requiredVideos.length,
      completedRequiredVideos,
      requiredVideoCompletionPercent,
      allRequiredVideosCompleted
    },
    videos: videosWithProgress
  };
};
var getMyAllVideoProgress = async (userId) => {
  assertValidObjectId6(userId, "User ID");
  const filter = {
    user: new Types26.ObjectId(userId)
  };
  return VideoProgress.find(filter).sort({
    lastWatchedAt: -1
  }).populate(
    "video",
    [
      "title",
      "slug",
      "thumbnailUrl",
      "durationSeconds",
      "requiredWatchPercent",
      "isRequired",
      "isPaid",
      "order",
      "status"
    ].join(" ")
  ).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title status"
    }
  });
};
var getAllVideoProgress = async (query) => {
  const filter = {};
  if (query.userId) {
    assertValidObjectId6(query.userId, "User ID");
    filter.user = new Types26.ObjectId(query.userId);
  }
  if (query.videoId) {
    assertValidObjectId6(query.videoId, "Module video ID");
    filter.video = new Types26.ObjectId(query.videoId);
  }
  if (query.moduleId) {
    assertValidObjectId6(query.moduleId, "Course module ID");
    filter.module = new Types26.ObjectId(query.moduleId);
  }
  if (query.isCompleted !== void 0) {
    filter.isCompleted = query.isCompleted;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [progressRecords, total] = await Promise.all([
    VideoProgress.find(filter).sort({
      lastWatchedAt: -1
    }).skip(skip).limit(limit).populate("user", "fullName email role profileImage").populate(
      "video",
      [
        "title",
        "slug",
        "thumbnailUrl",
        "durationSeconds",
        "requiredWatchPercent",
        "isRequired",
        "isPaid",
        "order",
        "status"
      ].join(" ")
    ).populate({
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title status"
      }
    }),
    VideoProgress.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: progressRecords
  };
};
var videoProgressService = {
  recordVideoHeartbeat,
  getMyVideoProgress,
  getMyModuleVideoProgress,
  getMyAllVideoProgress,
  getAllVideoProgress
};

// src/modules/videoProgress/video.progress.controller.ts
var throwControllerError6 = (message, statusCode) => {
  const error = new Error(
    message
  );
  error.statusCode = statusCode;
  throw error;
};
var assertFound12 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwControllerError6(message, statusCode);
  }
};
var getAuthUser11 = (req) => {
  const user = req.user;
  assertFound12(user, "Authentication required", 401);
  return {
    id: user.id,
    role: user.role
  };
};
var recordVideoHeartbeat2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser11(req);
    const payload = req.body;
    const result = await videoProgressService.recordVideoHeartbeat(
      authUser.id,
      String(
        req.params.videoId
      ),
      payload
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: result.isCompleted ? "Video completed successfully" : "Video progress updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyVideoProgress2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser11(req);
    const result = await videoProgressService.getMyVideoProgress(
      authUser.id,
      String(
        req.params.videoId
      )
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Video progress retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyModuleVideoProgress2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser11(req);
    const result = await videoProgressService.getMyModuleVideoProgress(
      authUser.id,
      String(
        req.params.moduleId
      )
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module video progress retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyAllVideoProgress2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser11(req);
    const result = await videoProgressService.getMyAllVideoProgress(
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Video progress history retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllVideoProgress2 = async (req, res, next) => {
  try {
    getAuthUser11(req);
    const query = {};
    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }
    if (typeof req.query.videoId === "string") {
      query.videoId = req.query.videoId;
    }
    if (typeof req.query.moduleId === "string") {
      query.moduleId = req.query.moduleId;
    }
    if (req.query.isCompleted === "true" || req.query.isCompleted === "false") {
      query.isCompleted = req.query.isCompleted === "true";
    }
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await videoProgressService.getAllVideoProgress(
      query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All video progress records retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var videoProgressController = {
  recordVideoHeartbeat: recordVideoHeartbeat2,
  getMyVideoProgress: getMyVideoProgress2,
  getMyModuleVideoProgress: getMyModuleVideoProgress2,
  getMyAllVideoProgress: getMyAllVideoProgress2,
  getAllVideoProgress: getAllVideoProgress2
};

// src/modules/videoProgress/video.progress.validation.ts
import { z as z16 } from "zod";
var mongoObjectIdSchema8 = z16.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var MAX_HEARTBEAT_SEGMENT_SECONDS2 = 60;
var recordVideoHeartbeatValidation = z16.object({
  params: z16.object({
    videoId: mongoObjectIdSchema8
  }),
  body: z16.object({
    segmentStartSeconds: z16.number().finite().nonnegative(),
    segmentEndSeconds: z16.number().finite().positive(),
    currentPositionSeconds: z16.number().finite().nonnegative()
  }).superRefine((data, context) => {
    if (data.segmentEndSeconds <= data.segmentStartSeconds) {
      context.addIssue({
        code: z16.ZodIssueCode.custom,
        path: ["segmentEndSeconds"],
        message: "Segment end must be greater than segment start"
      });
    }
    const segmentLength = data.segmentEndSeconds - data.segmentStartSeconds;
    if (segmentLength > MAX_HEARTBEAT_SEGMENT_SECONDS2) {
      context.addIssue({
        code: z16.ZodIssueCode.custom,
        path: ["segmentEndSeconds"],
        message: `A heartbeat segment cannot exceed ${MAX_HEARTBEAT_SEGMENT_SECONDS2} seconds`
      });
    }
  })
});
var videoProgressVideoIdValidation = z16.object({
  params: z16.object({
    videoId: mongoObjectIdSchema8
  })
});
var videoProgressModuleIdValidation = z16.object({
  params: z16.object({
    moduleId: mongoObjectIdSchema8
  })
});
var getAllVideoProgressValidation = z16.object({
  query: z16.object({
    userId: mongoObjectIdSchema8.optional(),
    videoId: mongoObjectIdSchema8.optional(),
    moduleId: mongoObjectIdSchema8.optional(),
    isCompleted: z16.enum(["true", "false"]).optional(),
    page: z16.coerce.number().int().min(1).default(1),
    limit: z16.coerce.number().int().min(1).max(100).default(20)
  })
});

// src/modules/videoProgress/video.progress.route.ts
var router24 = Router24();
router24.patch(
  "/video/:videoId/heartbeat",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(recordVideoHeartbeatValidation),
  videoProgressController.recordVideoHeartbeat
);
router24.get(
  "/video/:videoId/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(videoProgressVideoIdValidation),
  videoProgressController.getMyVideoProgress
);
router24.get(
  "/module/:moduleId/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(videoProgressModuleIdValidation),
  videoProgressController.getMyModuleVideoProgress
);
router24.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  videoProgressController.getMyAllVideoProgress
);
router24.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(getAllVideoProgressValidation),
  videoProgressController.getAllVideoProgress
);
var videoProgressRoutes = router24;

// src/modules/moduleProgress/module.progress.route.ts
import { Router as Router25 } from "express";

// src/modules/moduleProgress/module.progress.service.ts
import { Types as Types27 } from "mongoose";

// src/modules/moduleProgress/module.progress.model.schema.ts
import { model as model27, Schema as Schema27 } from "mongoose";

// src/modules/moduleProgress/module.progress.interface.ts
var QUIZ_PROGRESS_STATUSES = [
  "locked",
  "unlocked",
  "in_progress",
  "passed",
  "failed"
];

// src/modules/moduleProgress/module.progress.model.schema.ts
var requirementSummarySchema = new Schema27(
  {
    totalRequired: {
      type: Number,
      default: 0,
      min: 0,
      required: true
    },
    completedRequired: {
      type: Number,
      default: 0,
      min: 0,
      required: true
    },
    completionPercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      required: true
    },
    completed: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  {
    _id: false
  }
);
var quizSummarySchema = new Schema27(
  {
    status: {
      type: String,
      enum: QUIZ_PROGRESS_STATUSES,
      default: "locked",
      required: true
    },
    attemptsUsed: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
      required: true
    },
    maximumAttempts: {
      type: Number,
      default: 2,
      min: 2,
      max: 2,
      required: true
    },
    bestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true
    },
    passScore: {
      type: Number,
      default: 70,
      min: 70,
      max: 70,
      required: true
    },
    passed: {
      type: Boolean,
      default: false,
      required: true
    },
    lastAttemptAt: {
      type: Date
    }
  },
  {
    _id: false
  }
);
var moduleProgressSchema = new Schema27(
  {
    user: {
      type: Schema27.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    module: {
      type: Schema27.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    videoSummary: {
      type: requirementSummarySchema,
      default: () => ({
        totalRequired: 0,
        completedRequired: 0,
        completionPercent: 100,
        completed: true
      })
    },
    resourceSummary: {
      type: requirementSummarySchema,
      default: () => ({
        totalRequired: 0,
        completedRequired: 0,
        completionPercent: 100,
        completed: true
      })
    },
    actionSummary: {
      type: requirementSummarySchema,
      default: () => ({
        totalRequired: 0,
        completedRequired: 0,
        completionPercent: 100,
        completed: true
      })
    },
    quizSummary: {
      type: quizSummarySchema,
      default: () => ({
        status: "locked",
        attemptsUsed: 0,
        maximumAttempts: 2,
        bestScore: 0,
        passScore: 70,
        passed: false
      })
    },
    actionsUnlocked: {
      type: Boolean,
      default: false,
      required: true
    },
    quizUnlocked: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    overallCompletionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    completedAt: {
      type: Date
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: true,
    collection: "moduleprogress",
    optimisticConcurrency: true
  }
);
moduleProgressSchema.index(
  {
    user: 1,
    module: 1
  },
  {
    unique: true
  }
);
moduleProgressSchema.index({
  user: 1,
  isCompleted: 1,
  updatedAt: -1
});
moduleProgressSchema.index({
  module: 1,
  isCompleted: 1
});
var ModuleProgress = model27(
  "ModuleProgress",
  moduleProgressSchema
);

// src/modules/moduleProgress/module.progress.service.ts
var ACTION_COMPLETION_REQUIREMENT = 80;
var QUIZ_PASS_SCORE = 70;
var MAXIMUM_QUIZ_ATTEMPTS = 2;
var throwServiceError13 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound13 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError13(message, statusCode);
  }
};
var assertValidObjectId7 = (value, fieldName) => {
  if (!Types27.ObjectId.isValid(value)) {
    throwServiceError13(`${fieldName} is invalid`, 400);
  }
};
var isDuplicateKeyError5 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var roundToTwoDecimals = (value) => {
  return Math.round(value * 100) / 100;
};
var clamp2 = (value, minimum, maximum) => {
  return Math.min(Math.max(value, minimum), maximum);
};
var calculateCompletionPercent = (completed, total) => {
  if (total === 0) {
    return 100;
  }
  return roundToTwoDecimals(clamp2(completed / total * 100, 0, 100));
};
var ensureCourseModuleExists5 = async (moduleId) => {
  assertValidObjectId7(moduleId, "Course module ID");
  const courseModule = await CourseModule.findById(moduleId).select(
    "_id pillar title slug moduleNumber status"
  );
  assertFound13(courseModule, "Course module not found", 404);
  if (courseModule.status === "archived") {
    throwServiceError13("Archived module progress cannot be managed", 400);
  }
  return courseModule;
};
var createDefaultProgressData = (userId, moduleId) => {
  return {
    user: new Types27.ObjectId(userId),
    module: new Types27.ObjectId(moduleId),
    videoSummary: {
      totalRequired: 0,
      completedRequired: 0,
      completionPercent: 100,
      completed: true
    },
    resourceSummary: {
      totalRequired: 0,
      completedRequired: 0,
      completionPercent: 100,
      completed: true
    },
    actionSummary: {
      totalRequired: 0,
      completedRequired: 0,
      completionPercent: 100,
      completed: true
    },
    quizSummary: {
      status: "locked",
      attemptsUsed: 0,
      maximumAttempts: MAXIMUM_QUIZ_ATTEMPTS,
      bestScore: 0,
      passScore: QUIZ_PASS_SCORE,
      passed: false
    },
    actionsUnlocked: false,
    quizUnlocked: false,
    overallCompletionPercent: 0,
    isCompleted: false,
    lastCalculatedAt: /* @__PURE__ */ new Date()
  };
};
var getOrCreateModuleProgress = async (userId, moduleId) => {
  assertValidObjectId7(userId, "User ID");
  await ensureCourseModuleExists5(moduleId);
  const filter = {
    user: new Types27.ObjectId(userId),
    module: new Types27.ObjectId(moduleId)
  };
  const existingProgress = await ModuleProgress.findOne(filter);
  if (existingProgress) {
    return existingProgress;
  }
  try {
    return await ModuleProgress.create(
      createDefaultProgressData(userId, moduleId)
    );
  } catch (error) {
    if (!isDuplicateKeyError5(error)) {
      throw error;
    }
    const progress = await ModuleProgress.findOne(filter);
    assertFound13(progress, "Module progress could not be created", 500);
    return progress;
  }
};
var recalculateDerivedFields = (progress) => {
  progress.actionsUnlocked = progress.videoSummary.completed && progress.resourceSummary.completed;
  const requiredActionsCompleted = progress.actionSummary.totalRequired === 0 || progress.actionSummary.completionPercent >= ACTION_COMPLETION_REQUIREMENT;
  progress.actionSummary.completed = requiredActionsCompleted;
  progress.quizUnlocked = progress.actionsUnlocked && requiredActionsCompleted;
  if (progress.quizSummary.passed) {
    progress.quizSummary.status = "passed";
  } else if (!progress.quizUnlocked) {
    progress.quizSummary.status = "locked";
  } else if (progress.quizSummary.attemptsUsed === 0) {
    progress.quizSummary.status = "unlocked";
  } else if (progress.quizSummary.attemptsUsed < MAXIMUM_QUIZ_ATTEMPTS) {
    progress.quizSummary.status = "in_progress";
  } else {
    progress.quizSummary.status = "failed";
  }
  const videoStagePercent = progress.videoSummary.completionPercent;
  const resourceStagePercent = progress.resourceSummary.completionPercent;
  const actionStagePercent = progress.actionSummary.totalRequired === 0 ? 100 : clamp2(
    progress.actionSummary.completionPercent / ACTION_COMPLETION_REQUIREMENT * 100,
    0,
    100
  );
  const quizStagePercent = progress.quizSummary.passed ? 100 : 0;
  progress.overallCompletionPercent = roundToTwoDecimals(
    (videoStagePercent + resourceStagePercent + actionStagePercent + quizStagePercent) / 4
  );
  const moduleCompleted = progress.videoSummary.completed && progress.resourceSummary.completed && requiredActionsCompleted && progress.quizSummary.passed;
  const newlyCompleted = !progress.isCompleted && moduleCompleted;
  progress.isCompleted = moduleCompleted;
  if (newlyCompleted) {
    progress.completedAt = /* @__PURE__ */ new Date();
  }
  if (!moduleCompleted) {
    progress.set("completedAt", void 0);
  }
  progress.lastCalculatedAt = /* @__PURE__ */ new Date();
};
var refreshModuleProgress = async (userId, moduleId) => {
  const progress = await getOrCreateModuleProgress(userId, moduleId);
  const moduleObjectId = new Types27.ObjectId(moduleId);
  const userObjectId = new Types27.ObjectId(userId);
  const requiredVideos = await ModuleVideo.find({
    module: moduleObjectId,
    status: "published",
    isRequired: true
  }).select("_id").lean();
  const requiredVideoIds = requiredVideos.map((video) => video._id);
  const [
    completedRequiredVideos,
    totalRequiredResources,
    totalRequiredActions
  ] = await Promise.all([
    requiredVideoIds.length === 0 ? Promise.resolve(0) : VideoProgress.countDocuments({
      user: userObjectId,
      video: {
        $in: requiredVideoIds
      },
      isCompleted: true
    }),
    ModuleResource.countDocuments({
      module: moduleObjectId,
      status: "published",
      isRequired: true
    }),
    ModuleAction.countDocuments({
      module: moduleObjectId,
      status: "published",
      isRequired: true
    })
  ]);
  const totalRequiredVideos = requiredVideoIds.length;
  progress.set("videoSummary", {
    totalRequired: totalRequiredVideos,
    completedRequired: completedRequiredVideos,
    completionPercent: calculateCompletionPercent(
      completedRequiredVideos,
      totalRequiredVideos
    ),
    completed: totalRequiredVideos === 0 || completedRequiredVideos >= totalRequiredVideos
  });
  const completedResources = Math.min(
    progress.resourceSummary.completedRequired,
    totalRequiredResources
  );
  progress.set("resourceSummary", {
    totalRequired: totalRequiredResources,
    completedRequired: completedResources,
    completionPercent: calculateCompletionPercent(
      completedResources,
      totalRequiredResources
    ),
    completed: totalRequiredResources === 0 || completedResources >= totalRequiredResources
  });
  const completedActions = Math.min(
    progress.actionSummary.completedRequired,
    totalRequiredActions
  );
  const actionCompletionPercent = calculateCompletionPercent(
    completedActions,
    totalRequiredActions
  );
  progress.set("actionSummary", {
    totalRequired: totalRequiredActions,
    completedRequired: completedActions,
    completionPercent: actionCompletionPercent,
    completed: totalRequiredActions === 0 || actionCompletionPercent >= ACTION_COMPLETION_REQUIREMENT
  });
  recalculateDerivedFields(progress);
  await progress.save();
  return progress.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name title slug status"
      }
    }
  ]);
};
var syncResourceSummary = async (input) => {
  const progress = await getOrCreateModuleProgress(
    input.userId,
    input.moduleId
  );
  const totalRequired = Math.max(0, input.totalRequired);
  const completedRequired = clamp2(input.completedRequired, 0, totalRequired);
  const completionPercent = calculateCompletionPercent(
    completedRequired,
    totalRequired
  );
  progress.set("resourceSummary", {
    totalRequired,
    completedRequired,
    completionPercent,
    completed: totalRequired === 0 || completedRequired >= totalRequired
  });
  recalculateDerivedFields(progress);
  await progress.save();
  return progress;
};
var syncActionSummary = async (input) => {
  const progress = await getOrCreateModuleProgress(
    input.userId,
    input.moduleId
  );
  const totalRequired = Math.max(0, input.totalRequired);
  const completedRequired = clamp2(input.completedRequired, 0, totalRequired);
  const completionPercent = calculateCompletionPercent(
    completedRequired,
    totalRequired
  );
  progress.set("actionSummary", {
    totalRequired,
    completedRequired,
    completionPercent,
    completed: totalRequired === 0 || completionPercent >= ACTION_COMPLETION_REQUIREMENT
  });
  recalculateDerivedFields(progress);
  await progress.save();
  return progress;
};
var syncQuizSummary = async (input) => {
  const progress = await getOrCreateModuleProgress(
    input.userId,
    input.moduleId
  );
  const attemptsUsed = clamp2(input.attemptsUsed, 0, MAXIMUM_QUIZ_ATTEMPTS);
  const bestScore = clamp2(
    Math.max(progress.quizSummary.bestScore, input.bestScore),
    0,
    100
  );
  progress.quizSummary.attemptsUsed = attemptsUsed;
  progress.quizSummary.maximumAttempts = MAXIMUM_QUIZ_ATTEMPTS;
  progress.quizSummary.bestScore = bestScore;
  progress.quizSummary.passScore = QUIZ_PASS_SCORE;
  progress.quizSummary.passed = progress.quizSummary.passed || input.passed || bestScore >= QUIZ_PASS_SCORE;
  if (input.lastAttemptAt !== void 0) {
    progress.quizSummary.lastAttemptAt = input.lastAttemptAt;
  }
  recalculateDerivedFields(progress);
  await progress.save();
  return progress;
};
var getMyModuleProgress = async (userId, moduleId) => {
  return refreshModuleProgress(userId, moduleId);
};
var getMyAllModuleProgress = async (userId) => {
  assertValidObjectId7(userId, "User ID");
  const filter = {
    user: new Types27.ObjectId(userId)
  };
  return ModuleProgress.find(filter).sort({
    updatedAt: -1
  }).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name title slug status"
    }
  });
};
var getUserModuleProgress = async (userId, moduleId) => {
  return refreshModuleProgress(userId, moduleId);
};
var getAllModuleProgress = async (query) => {
  const filter = {};
  if (query.userId) {
    assertValidObjectId7(query.userId, "User ID");
    filter.user = new Types27.ObjectId(query.userId);
  }
  if (query.moduleId) {
    assertValidObjectId7(query.moduleId, "Course module ID");
    filter.module = new Types27.ObjectId(query.moduleId);
  }
  if (query.isCompleted !== void 0) {
    filter.isCompleted = query.isCompleted;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    ModuleProgress.find(filter).sort({
      updatedAt: -1
    }).skip(skip).limit(limit).populate("user", "fullName email role profileImage").populate({
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name title slug status"
      }
    }),
    ModuleProgress.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: records
  };
};
var moduleProgressService = {
  refreshModuleProgress,
  syncResourceSummary,
  syncActionSummary,
  syncQuizSummary,
  getMyModuleProgress,
  getMyAllModuleProgress,
  getUserModuleProgress,
  getAllModuleProgress
};

// src/modules/moduleProgress/module.progress.controller.ts
var getAuthUser12 = (req) => {
  const user = req.user;
  assertFound_default(user, "Authentication required", 401);
  return {
    id: user.id,
    role: user.role
  };
};
var getMyModuleProgress2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser12(req);
    const result = await moduleProgressService.getMyModuleProgress(
      authUser.id,
      String(req.params.moduleId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module progress retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var recalculateMyModuleProgress = async (req, res, next) => {
  try {
    const authUser = getAuthUser12(req);
    const result = await moduleProgressService.refreshModuleProgress(
      authUser.id,
      String(req.params.moduleId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module progress recalculated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyAllModuleProgress2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser12(req);
    const result = await moduleProgressService.getMyAllModuleProgress(
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module progress history retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getUserModuleProgress2 = async (req, res, next) => {
  try {
    getAuthUser12(req);
    const result = await moduleProgressService.getUserModuleProgress(
      String(req.params.userId),
      String(req.params.moduleId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User module progress retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllModuleProgress2 = async (req, res, next) => {
  try {
    getAuthUser12(req);
    const query = {};
    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }
    if (typeof req.query.moduleId === "string") {
      query.moduleId = req.query.moduleId;
    }
    if (req.query.isCompleted === "true" || req.query.isCompleted === "false") {
      query.isCompleted = req.query.isCompleted === "true";
    }
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await moduleProgressService.getAllModuleProgress(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Module progress records retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moduleProgressController = {
  getMyModuleProgress: getMyModuleProgress2,
  recalculateMyModuleProgress,
  getMyAllModuleProgress: getMyAllModuleProgress2,
  getUserModuleProgress: getUserModuleProgress2,
  getAllModuleProgress: getAllModuleProgress2
};

// src/modules/moduleProgress/module.progress.validation.ts
import { z as z17 } from "zod";
var mongoObjectIdSchema9 = z17.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var moduleProgressModuleIdValidation = z17.object({
  params: z17.object({
    moduleId: mongoObjectIdSchema9
  })
});
var adminModuleProgressValidation = z17.object({
  params: z17.object({
    userId: mongoObjectIdSchema9,
    moduleId: mongoObjectIdSchema9
  })
});
var getAllModuleProgressValidation = z17.object({
  query: z17.object({
    userId: mongoObjectIdSchema9.optional(),
    moduleId: mongoObjectIdSchema9.optional(),
    isCompleted: z17.enum(["true", "false"]).optional(),
    page: z17.coerce.number().int().min(1).default(1),
    limit: z17.coerce.number().int().min(1).max(100).default(20)
  })
});

// src/modules/moduleProgress/module.progress.route.ts
var router25 = Router25();
router25.get(
  "/me/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(moduleProgressModuleIdValidation),
  moduleProgressController.getMyModuleProgress
);
router25.post(
  "/me/module/:moduleId/recalculate",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(moduleProgressModuleIdValidation),
  moduleProgressController.recalculateMyModuleProgress
);
router25.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  moduleProgressController.getMyAllModuleProgress
);
router25.get(
  "/user/:userId/module/:moduleId",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(adminModuleProgressValidation),
  moduleProgressController.getUserModuleProgress
);
router25.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(getAllModuleProgressValidation),
  moduleProgressController.getAllModuleProgress
);
var moduleProgressRoutes = router25;

// src/modules/quizAttempts/quiz.attempt.route.ts
import { Router as Router26 } from "express";

// src/modules/quizAttempts/quiz.attempt.service.ts
import { Types as Types28 } from "mongoose";

// src/modules/quizAttempts/quiz.attempt.model.schema.ts
import { model as model28, Schema as Schema28 } from "mongoose";
var quizAttemptAnswerSchema = new Schema28(
  {
    question: {
      type: Schema28.Types.ObjectId,
      ref: "QuizQuestion",
      required: true
    },
    selectedOptionIndexes: {
      type: [
        {
          type: Number,
          min: 0
        }
      ],
      default: void 0
    },
    booleanAnswer: {
      type: Boolean
    },
    isCorrect: {
      type: Boolean,
      required: true
    }
  },
  {
    _id: false
  }
);
var quizAttemptSchema = new Schema28(
  {
    user: {
      type: Schema28.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    module: {
      type: Schema28.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 2
    },
    answers: {
      type: [quizAttemptAnswerSchema],
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    passed: {
      type: Boolean,
      required: true,
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: true,
    collection: "quizattempts"
  }
);
quizAttemptSchema.index(
  {
    user: 1,
    module: 1,
    attemptNumber: 1
  },
  {
    unique: true
  }
);
quizAttemptSchema.index({
  user: 1,
  module: 1,
  submittedAt: -1
});
quizAttemptSchema.index({
  module: 1,
  passed: 1
});
var QuizAttempt = model28(
  "QuizAttempt",
  quizAttemptSchema
);

// src/modules/quizAttempts/quiz.attempt.service.ts
var MAXIMUM_ATTEMPTS = 2;
var PASS_SCORE = 70;
var throwServiceError14 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound14 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError14(message, statusCode);
  }
};
var assertValidObjectId8 = (value, fieldName) => {
  if (!Types28.ObjectId.isValid(value)) {
    throwServiceError14(`${fieldName} is invalid`, 400);
  }
};
var isDuplicateKeyError6 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var roundToTwoDecimals2 = (value) => {
  return Math.round(value * 100) / 100;
};
var normalizeIndexes = (indexes) => {
  return [...indexes].sort((first, second) => first - second);
};
var arraysAreEqual = (first, second) => {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((value, index) => value === second[index]);
};
var validateSelectedIndexes = (selectedIndexes, optionCount) => {
  const uniqueIndexes = new Set(selectedIndexes);
  if (uniqueIndexes.size !== selectedIndexes?.length) {
    throwServiceError14("Selected option indexes must be unique", 400);
  }
  for (const index of selectedIndexes) {
    if (index < 0 || index >= optionCount) {
      throwServiceError14(
        "Selected option index is outside the available options",
        400
      );
    }
  }
};
var ensureModuleIsAvailable = async (moduleId) => {
  assertValidObjectId8(moduleId, "Course module ID");
  const courseModule = await CourseModule.findById(moduleId).select(
    "_id pillar title slug moduleNumber status"
  );
  assertFound14(courseModule, "Course module not found", 404);
  if (courseModule.status !== "published") {
    throwServiceError14("Course module is not published", 403);
  }
  return courseModule;
};
var submitQuizAttempt = async (userId, moduleId, payload) => {
  assertValidObjectId8(userId, "User ID");
  await ensureModuleIsAvailable(moduleId);
  const moduleProgress = await moduleProgressService.refreshModuleProgress(
    userId,
    moduleId
  );
  if (!moduleProgress.quizUnlocked) {
    throwServiceError14(
      "Quiz is locked. Complete the required videos, resources and at least 80% of required actions first",
      403
    );
  }
  const previousAttempts = await QuizAttempt.find({
    user: new Types28.ObjectId(userId),
    module: new Types28.ObjectId(moduleId)
  }).sort({
    attemptNumber: 1
  }).select("attemptNumber score passed submittedAt").lean();
  if (previousAttempts.some((attempt2) => attempt2.passed)) {
    throwServiceError14("This quiz has already been passed", 409);
  }
  if (previousAttempts.length >= MAXIMUM_ATTEMPTS) {
    throwServiceError14("Maximum two quiz attempts have already been used", 400);
  }
  const questions = await QuizQuestion.find({
    module: new Types28.ObjectId(moduleId),
    status: "published"
  }).sort({
    order: 1
  }).select(
    [
      "_id",
      "question",
      "questionType",
      "options",
      "correctOptionIndexes",
      "correctBooleanAnswer",
      "order"
    ].join(" ")
  ).lean();
  if (questions.length === 0) {
    throwServiceError14("No published quiz questions are available", 400);
  }
  const answerMap = new Map(
    payload.answers.map((answer) => [answer.questionId, answer])
  );
  if (answerMap.size !== payload.answers.length) {
    throwServiceError14("A question cannot be answered more than once", 400);
  }
  if (payload.answers.length !== questions.length) {
    throwServiceError14("Every published quiz question must be answered", 400);
  }
  const validQuestionIds = new Set(
    questions.map((question) => question._id.toString())
  );
  for (const submittedAnswer of payload.answers) {
    if (!validQuestionIds.has(submittedAnswer.questionId)) {
      throwServiceError14(
        "An answer references a question outside this module quiz",
        400
      );
    }
  }
  const calculatedAnswers = [];
  let correctAnswers = 0;
  for (const question of questions) {
    const questionId = question._id.toString();
    const submittedAnswer = answerMap.get(questionId);
    assertFound14(submittedAnswer, "A required quiz answer is missing", 400);
    let isCorrect = false;
    const answerData = {
      question: question._id
    };
    if (question.questionType === "true_false") {
      if (typeof submittedAnswer.booleanAnswer !== "boolean") {
        throwServiceError14(
          `Question ${question.order} requires a boolean answer`,
          400
        );
      }
      if (submittedAnswer.selectedOptionIndexes !== void 0) {
        throwServiceError14(
          `Question ${question.order} does not accept option indexes`,
          400
        );
      }
      if (typeof question.correctBooleanAnswer !== "boolean") {
        throwServiceError14(
          `Question ${question.order} has an invalid answer configuration`,
          500
        );
      }
      isCorrect = submittedAnswer.booleanAnswer === question.correctBooleanAnswer;
      answerData.booleanAnswer = submittedAnswer.booleanAnswer;
    } else {
      const selectedIndexes = submittedAnswer.selectedOptionIndexes;
      if (!selectedIndexes || selectedIndexes.length === 0) {
        throwServiceError14(
          `Question ${question.order} requires selected option indexes`,
          400
        );
      }
      if (submittedAnswer.booleanAnswer !== void 0) {
        throwServiceError14(
          `Question ${question.order} does not accept a boolean answer`,
          400
        );
      }
      const options2 = question.options ? [...question.options] : [];
      assertFound14(
        selectedIndexes,
        `Question ${question.order} requires selected option indexes`,
        400
      );
      validateSelectedIndexes(selectedIndexes, options2.length);
      if (question.questionType === "single_choice" && selectedIndexes?.length !== 1) {
        throwServiceError14(
          `Question ${question.order} requires exactly one selected option`,
          400
        );
      }
      const correctIndexes = question.correctOptionIndexes ? [...question.correctOptionIndexes] : [];
      if (correctIndexes.length === 0) {
        throwServiceError14(
          `Question ${question.order} has no configured correct answer`,
          500
        );
      }
      isCorrect = arraysAreEqual(
        normalizeIndexes(selectedIndexes),
        normalizeIndexes(correctIndexes)
      );
      answerData.selectedOptionIndexes = selectedIndexes;
    }
    answerData.isCorrect = isCorrect;
    calculatedAnswers.push(answerData);
    if (isCorrect) {
      correctAnswers += 1;
    }
  }
  const totalQuestions = questions.length;
  const score = roundToTwoDecimals2(correctAnswers / totalQuestions * 100);
  const passed = score >= PASS_SCORE;
  const previousHighestAttempt = previousAttempts.reduce(
    (highest, attempt2) => Math.max(highest, attempt2.attemptNumber),
    0
  );
  const attemptNumber = previousHighestAttempt + 1;
  const submittedAt = /* @__PURE__ */ new Date();
  let attempt;
  try {
    attempt = await QuizAttempt.create({
      user: new Types28.ObjectId(userId),
      module: new Types28.ObjectId(moduleId),
      attemptNumber,
      answers: calculatedAnswers,
      totalQuestions,
      correctAnswers,
      score,
      passed,
      submittedAt
    });
  } catch (error) {
    if (isDuplicateKeyError6(error)) {
      throwServiceError14(
        "A quiz attempt is already being processed. Please refresh before trying again",
        409
      );
    }
    throw error;
  }
  const allAttempts = await QuizAttempt.find({
    user: new Types28.ObjectId(userId),
    module: new Types28.ObjectId(moduleId)
  }).select("score passed submittedAt").lean();
  const bestScore = allAttempts.reduce(
    (highestScore, item) => Math.max(highestScore, item.score),
    0
  );
  const hasPassed = allAttempts.some((item) => item.passed);
  const latestAttemptAt = allAttempts.reduce(
    (latestDate, item) => {
      if (!latestDate) {
        return item.submittedAt;
      }
      return item.submittedAt > latestDate ? item.submittedAt : latestDate;
    },
    void 0
  );
  await moduleProgressService.syncQuizSummary({
    userId,
    moduleId,
    attemptsUsed: allAttempts.length,
    bestScore,
    passed: hasPassed,
    ...latestAttemptAt !== void 0 ? {
      lastAttemptAt: latestAttemptAt
    } : {}
  });
  return attempt.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name title slug status"
      }
    },
    {
      path: "answers.question",
      select: [
        "question",
        "questionType",
        "options",
        "explanation",
        "order"
      ].join(" ")
    }
  ]);
};
var getMyModuleAttempts = async (userId, moduleId) => {
  assertValidObjectId8(userId, "User ID");
  assertValidObjectId8(moduleId, "Course module ID");
  return QuizAttempt.find({
    user: new Types28.ObjectId(userId),
    module: new Types28.ObjectId(moduleId)
  }).sort({
    attemptNumber: 1
  }).populate(
    "answers.question",
    ["question", "questionType", "options", "explanation", "order"].join(" ")
  );
};
var getMySingleAttempt = async (userId, attemptId) => {
  assertValidObjectId8(userId, "User ID");
  assertValidObjectId8(attemptId, "Quiz attempt ID");
  const filter = {
    _id: new Types28.ObjectId(attemptId),
    user: new Types28.ObjectId(userId)
  };
  const attempt = await QuizAttempt.findOne(filter).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name title slug status"
    }
  }).populate(
    "answers.question",
    ["question", "questionType", "options", "explanation", "order"].join(" ")
  );
  assertFound14(attempt, "Quiz attempt not found", 404);
  return attempt;
};
var getSingleAttemptAdmin = async (attemptId) => {
  assertValidObjectId8(attemptId, "Quiz attempt ID");
  const attempt = await QuizAttempt.findById(attemptId).populate("user", "fullName email role profileImage").populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name title slug status"
    }
  }).populate(
    "answers.question",
    [
      "question",
      "questionType",
      "options",
      "correctOptionIndexes",
      "correctBooleanAnswer",
      "explanation",
      "order"
    ].join(" ")
  );
  assertFound14(attempt, "Quiz attempt not found", 404);
  return attempt;
};
var getAllQuizAttempts = async (query) => {
  const filter = {};
  if (query.userId) {
    assertValidObjectId8(query.userId, "User ID");
    filter.user = new Types28.ObjectId(query.userId);
  }
  if (query.moduleId) {
    assertValidObjectId8(query.moduleId, "Course module ID");
    filter.module = new Types28.ObjectId(query.moduleId);
  }
  if (query.passed !== void 0) {
    filter.passed = query.passed;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [attempts, total] = await Promise.all([
    QuizAttempt.find(filter).sort({
      submittedAt: -1
    }).skip(skip).limit(limit).populate("user", "fullName email role profileImage").populate({
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name title slug status"
      }
    }),
    QuizAttempt.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: attempts
  };
};
var quizAttemptService = {
  submitQuizAttempt,
  getMyModuleAttempts,
  getMySingleAttempt,
  getSingleAttemptAdmin,
  getAllQuizAttempts
};

// src/modules/quizAttempts/quiz.attempt.controller.ts
var getAuthUser13 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var submitQuizAttempt2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser13(req);
    const result = await quizAttemptService.submitQuizAttempt(
      authUser.id,
      String(
        req.params.moduleId
      ),
      req.body
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: result.passed ? "Quiz passed successfully" : result.attemptNumber < 2 ? "Quiz submitted. One retake remains" : "Quiz submitted. Maximum attempts used",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyModuleAttempts2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser13(req);
    const result = await quizAttemptService.getMyModuleAttempts(
      authUser.id,
      String(
        req.params.moduleId
      )
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz attempts retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMySingleAttempt2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser13(req);
    const result = await quizAttemptService.getMySingleAttempt(
      authUser.id,
      String(
        req.params.attemptId
      )
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz attempt retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleAttemptAdmin2 = async (req, res, next) => {
  try {
    getAuthUser13(req);
    const result = await quizAttemptService.getSingleAttemptAdmin(
      String(
        req.params.id
      )
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz attempt retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllQuizAttempts2 = async (req, res, next) => {
  try {
    getAuthUser13(req);
    const query = {};
    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }
    if (typeof req.query.moduleId === "string") {
      query.moduleId = req.query.moduleId;
    }
    if (req.query.passed === "true" || req.query.passed === "false") {
      query.passed = req.query.passed === "true";
    }
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await quizAttemptService.getAllQuizAttempts(
      query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Quiz attempts retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var quizAttemptController = {
  submitQuizAttempt: submitQuizAttempt2,
  getMyModuleAttempts: getMyModuleAttempts2,
  getMySingleAttempt: getMySingleAttempt2,
  getSingleAttemptAdmin: getSingleAttemptAdmin2,
  getAllQuizAttempts: getAllQuizAttempts2
};

// src/modules/quizAttempts/quiz.attempt.validation.ts
import { z as z18 } from "zod";
var mongoObjectIdSchema10 = z18.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var quizAnswerSchema = z18.object({
  questionId: mongoObjectIdSchema10,
  selectedOptionIndexes: z18.array(z18.number().int().nonnegative()).min(1).max(8).optional(),
  booleanAnswer: z18.boolean().optional()
}).strict().superRefine((answer, context) => {
  const hasChoiceAnswer = answer.selectedOptionIndexes !== void 0;
  const hasBooleanAnswer = answer.booleanAnswer !== void 0;
  if (!hasChoiceAnswer && !hasBooleanAnswer) {
    context.addIssue({
      code: z18.ZodIssueCode.custom,
      message: "An answer value is required"
    });
  }
  if (hasChoiceAnswer && hasBooleanAnswer) {
    context.addIssue({
      code: z18.ZodIssueCode.custom,
      message: "Provide either selectedOptionIndexes or booleanAnswer, not both"
    });
  }
});
var submitQuizAttemptValidation = z18.object({
  params: z18.object({
    moduleId: mongoObjectIdSchema10
  }),
  body: z18.object({
    answers: z18.array(quizAnswerSchema).min(1).max(5)
  }).strict()
});
var quizAttemptIdValidation = z18.object({
  params: z18.object({
    attemptId: mongoObjectIdSchema10
  })
});
var quizAttemptModuleValidation = z18.object({
  params: z18.object({
    moduleId: mongoObjectIdSchema10
  })
});
var adminQuizAttemptIdValidation = z18.object({
  params: z18.object({
    id: mongoObjectIdSchema10
  })
});
var getAllQuizAttemptsValidation = z18.object({
  query: z18.object({
    userId: mongoObjectIdSchema10.optional(),
    moduleId: mongoObjectIdSchema10.optional(),
    passed: z18.enum(["true", "false"]).optional(),
    page: z18.coerce.number().int().min(1).default(1),
    limit: z18.coerce.number().int().min(1).max(100).default(20)
  })
});

// src/modules/quizAttempts/quiz.attempt.route.ts
var router26 = Router26();
router26.post(
  "/module/:moduleId/submit",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(submitQuizAttemptValidation),
  quizAttemptController.submitQuizAttempt
);
router26.get(
  "/me/module/:moduleId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(quizAttemptModuleValidation),
  quizAttemptController.getMyModuleAttempts
);
router26.get(
  "/me/:attemptId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(quizAttemptIdValidation),
  quizAttemptController.getMySingleAttempt
);
router26.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(getAllQuizAttemptsValidation),
  quizAttemptController.getAllQuizAttempts
);
router26.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(adminQuizAttemptIdValidation),
  quizAttemptController.getSingleAttemptAdmin
);
var quizAttemptRoutes = router26;

// src/modules/quizCertificates/quiz.certificate.route.ts
import { Router as Router27 } from "express";

// src/modules/quizCertificates/quiz.certificate.service.ts
import { Types as Types29 } from "mongoose";

// src/modules/quizCertificates/quiz.certificate.model.schema.ts
import { model as model29, Schema as Schema29 } from "mongoose";

// src/modules/quizCertificates/quiz.certificate.interface.ts
var CERTIFICATE_STATUSES = ["issued", "revoked"];

// src/modules/quizCertificates/quiz.certificate.model.schema.ts
var quizCertificateSchema = new Schema29(
  {
    user: {
      type: Schema29.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    module: {
      type: Schema29.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true
    },
    pillar: {
      type: Schema29.Types.ObjectId,
      ref: "ChallengePillar",
      required: true,
      index: true
    },
    quizAttempt: {
      type: Schema29.Types.ObjectId,
      ref: "QuizAttempt"
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: CERTIFICATE_STATUSES,
      default: "issued",
      index: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    certificateUrl: {
      type: String,
      trim: true
    },
    revokedAt: {
      type: Date
    },
    revokedReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    revokedBy: {
      type: Schema29.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "quizcertificates"
  }
);
quizCertificateSchema.index(
  {
    user: 1,
    module: 1
  },
  {
    unique: true
  }
);
quizCertificateSchema.index({
  user: 1,
  pillar: 1
});
quizCertificateSchema.index({
  status: 1,
  issuedAt: -1
});
var QuizCertificate = model29(
  "QuizCertificate",
  quizCertificateSchema
);

// src/modules/quizCertificates/quiz.certificate.service.ts
var throwServiceError15 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound15 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError15(message, statusCode);
  }
};
var assertValidObjectId9 = (value, fieldName) => {
  if (!Types29.ObjectId.isValid(value)) {
    throwServiceError15(`${fieldName} is invalid`, 400);
  }
};
var isAdminOrManager11 = (role) => {
  return role === "admin" || role === "manager";
};
var isDuplicateKeyError7 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var CERTIFICATE_POPULATE = [
  {
    path: "user",
    select: "fullName email role profileImage"
  },
  {
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title status"
    }
  },
  {
    path: "pillar",
    select: "name slug title status"
  },
  {
    path: "revokedBy",
    select: "fullName email role"
  }
];
var randomAlphaNumeric = (length) => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return result;
};
var buildCertificateNumber = (pillarSlug, moduleNumber) => {
  return [
    "INV",
    pillarSlug.toUpperCase(),
    `M${moduleNumber}`,
    randomAlphaNumeric(6)
  ].join("-");
};
var issueCertificateIfEligible = async (userId, moduleId) => {
  assertValidObjectId9(userId, "User ID");
  assertValidObjectId9(moduleId, "Course module ID");
  const existingCertificate = await QuizCertificate.findOne({
    user: new Types29.ObjectId(userId),
    module: new Types29.ObjectId(moduleId)
  }).populate(CERTIFICATE_POPULATE);
  if (existingCertificate) {
    return existingCertificate;
  }
  const moduleProgress = await ModuleProgress.findOne({
    user: new Types29.ObjectId(userId),
    module: new Types29.ObjectId(moduleId)
  }).lean();
  assertFound15(
    moduleProgress,
    "Module progress not found. Complete the module requirements first",
    404
  );
  if (!moduleProgress.quizSummary?.passed) {
    throwServiceError15(
      "Quiz must be passed before a certificate can be issued",
      403
    );
  }
  const courseModule = await CourseModule.findById(moduleId).populate(
    "pillar",
    "name slug title status"
  );
  assertFound15(courseModule, "Course module not found", 404);
  const pillar = courseModule.pillar;
  assertFound15(pillar, "Parent challenge pillar not found", 404);
  const createData = {
    user: new Types29.ObjectId(userId),
    module: new Types29.ObjectId(moduleId),
    pillar: pillar._id,
    certificateNumber: buildCertificateNumber(
      pillar.slug,
      courseModule.moduleNumber
    ),
    status: "issued",
    score: moduleProgress.quizSummary.bestScore,
    issuedAt: /* @__PURE__ */ new Date()
  };
  const MAX_ATTEMPTS = 5;
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const certificate = await QuizCertificate.create({
        ...createData,
        certificateNumber: buildCertificateNumber(
          pillar.slug,
          courseModule.moduleNumber
        )
      });
      return certificate.populate(CERTIFICATE_POPULATE);
    } catch (error) {
      lastError = error;
      if (isDuplicateKeyError7(error)) {
        const raceCertificate = await QuizCertificate.findOne({
          user: new Types29.ObjectId(userId),
          module: new Types29.ObjectId(moduleId)
        }).populate(CERTIFICATE_POPULATE);
        if (raceCertificate) {
          return raceCertificate;
        }
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};
var getMyCertificates = async (userId) => {
  assertValidObjectId9(userId, "User ID");
  return QuizCertificate.find({
    user: new Types29.ObjectId(userId)
  }).sort({ issuedAt: -1 }).populate(CERTIFICATE_POPULATE);
};
var getMySingleCertificate = async (userId, certificateId) => {
  assertValidObjectId9(userId, "User ID");
  assertValidObjectId9(certificateId, "Certificate ID");
  const certificate = await QuizCertificate.findOne({
    _id: certificateId,
    user: new Types29.ObjectId(userId)
  }).populate(CERTIFICATE_POPULATE);
  assertFound15(certificate, "Certificate not found", 404);
  return certificate;
};
var verifyCertificateByNumber = async (certificateNumber) => {
  const certificate = await QuizCertificate.findOne({
    certificateNumber: certificateNumber.trim().toUpperCase()
  }).populate(CERTIFICATE_POPULATE);
  assertFound15(certificate, "Certificate not found", 404);
  return {
    valid: certificate.status === "issued",
    certificate
  };
};
var getSingleCertificateAdmin = async (certificateId) => {
  assertValidObjectId9(certificateId, "Certificate ID");
  const certificate = await QuizCertificate.findById(
    certificateId
  ).populate(CERTIFICATE_POPULATE);
  assertFound15(certificate, "Certificate not found", 404);
  return certificate;
};
var getAllCertificatesAdmin = async (query) => {
  const filter = {};
  if (query.userId) {
    assertValidObjectId9(query.userId, "User ID");
    filter.user = new Types29.ObjectId(query.userId);
  }
  if (query.moduleId) {
    assertValidObjectId9(query.moduleId, "Course module ID");
    filter.module = new Types29.ObjectId(query.moduleId);
  }
  if (query.pillarId) {
    assertValidObjectId9(query.pillarId, "Challenge pillar ID");
    filter.pillar = new Types29.ObjectId(query.pillarId);
  }
  if (query.status) {
    filter.status = query.status;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [certificates, total] = await Promise.all([
    QuizCertificate.find(filter).sort({ issuedAt: -1 }).skip(skip).limit(limit).populate(CERTIFICATE_POPULATE),
    QuizCertificate.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: certificates
  };
};
var attachCertificateUrl = async (certificateId, payload) => {
  assertValidObjectId9(certificateId, "Certificate ID");
  const certificate = await QuizCertificate.findById(certificateId);
  assertFound15(certificate, "Certificate not found", 404);
  certificate.certificateUrl = payload.certificateUrl;
  await certificate.save();
  return certificate.populate(CERTIFICATE_POPULATE);
};
var revokeCertificate = async (certificateId, actorId, reason) => {
  assertValidObjectId9(certificateId, "Certificate ID");
  assertValidObjectId9(actorId, "Actor ID");
  const certificate = await QuizCertificate.findById(certificateId);
  assertFound15(certificate, "Certificate not found", 404);
  if (certificate.status === "revoked") {
    throwServiceError15("Certificate is already revoked", 400);
  }
  certificate.status = "revoked";
  certificate.revokedAt = /* @__PURE__ */ new Date();
  certificate.revokedBy = new Types29.ObjectId(actorId);
  if (reason !== void 0) {
    certificate.revokedReason = reason;
  }
  await certificate.save();
  return certificate.populate(CERTIFICATE_POPULATE);
};
var isAdminOrManagerRole = isAdminOrManager11;
var quizCertificateService = {
  issueCertificateIfEligible,
  getMyCertificates,
  getMySingleCertificate,
  verifyCertificateByNumber,
  getSingleCertificateAdmin,
  getAllCertificatesAdmin,
  attachCertificateUrl,
  revokeCertificate,
  isAdminOrManagerRole
};

// src/modules/quizCertificates/quiz.certificate.controller.ts
var getAuthUser14 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var issueMyCertificate = async (req, res, next) => {
  try {
    const authUser = getAuthUser14(req);
    const certificate = await quizCertificateService.issueCertificateIfEligible(
      authUser.id,
      String(req.params.moduleId)
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Certificate issued successfully",
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};
var getMyCertificates2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser14(req);
    const certificates = await quizCertificateService.getMyCertificates(
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Certificates retrieved successfully",
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};
var getMySingleCertificate2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser14(req);
    const certificate = await quizCertificateService.getMySingleCertificate(
      authUser.id,
      String(req.params.certificateId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Certificate retrieved successfully",
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};
var verifyCertificate = async (req, res, next) => {
  try {
    const result = await quizCertificateService.verifyCertificateByNumber(
      String(req.params.certificateNumber)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Certificate verification completed",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleCertificateAdmin2 = async (req, res, next) => {
  try {
    getAuthUser14(req);
    const certificate = await quizCertificateService.getSingleCertificateAdmin(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Certificate retrieved successfully",
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};
var getAllCertificatesAdmin2 = async (req, res, next) => {
  try {
    getAuthUser14(req);
    const query = {};
    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }
    if (typeof req.query.moduleId === "string") {
      query.moduleId = req.query.moduleId;
    }
    if (typeof req.query.pillarId === "string") {
      query.pillarId = req.query.pillarId;
    }
    if (req.query.status === "issued" || req.query.status === "revoked") {
      query.status = req.query.status;
    }
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await quizCertificateService.getAllCertificatesAdmin(
      query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Certificates retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var attachCertificateUrl2 = async (req, res, next) => {
  try {
    getAuthUser14(req);
    const certificate = await quizCertificateService.attachCertificateUrl(
      String(req.params.id),
      req.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Certificate file attached successfully",
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};
var revokeCertificate2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser14(req);
    const certificate = await quizCertificateService.revokeCertificate(
      String(req.params.id),
      authUser.id,
      req.body?.reason
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Certificate revoked successfully",
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};
var quizCertificateController = {
  issueMyCertificate,
  getMyCertificates: getMyCertificates2,
  getMySingleCertificate: getMySingleCertificate2,
  verifyCertificate,
  getSingleCertificateAdmin: getSingleCertificateAdmin2,
  getAllCertificatesAdmin: getAllCertificatesAdmin2,
  attachCertificateUrl: attachCertificateUrl2,
  revokeCertificate: revokeCertificate2
};

// src/modules/quizCertificates/quiz.certificate.validation.ts
import { z as z19 } from "zod";
var mongoObjectIdSchema11 = z19.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var issueCertificateValidation = z19.object({
  params: z19.object({
    moduleId: mongoObjectIdSchema11
  })
});
var certificateIdValidation = z19.object({
  params: z19.object({
    certificateId: mongoObjectIdSchema11
  })
});
var adminCertificateIdValidation = z19.object({
  params: z19.object({
    id: mongoObjectIdSchema11
  })
});
var verifyCertificateValidation = z19.object({
  params: z19.object({
    certificateNumber: z19.string().trim().min(5).max(60)
  })
});
var attachCertificateUrlValidation = z19.object({
  params: z19.object({
    id: mongoObjectIdSchema11
  }),
  body: z19.object({
    certificateUrl: z19.string().trim().url()
  }).strict()
});
var revokeCertificateValidation = z19.object({
  params: z19.object({
    id: mongoObjectIdSchema11
  }),
  body: z19.object({
    reason: z19.string().trim().max(500).optional()
  }).strict()
});
var getAllCertificatesValidation = z19.object({
  query: z19.object({
    userId: mongoObjectIdSchema11.optional(),
    moduleId: mongoObjectIdSchema11.optional(),
    pillarId: mongoObjectIdSchema11.optional(),
    status: z19.enum(["issued", "revoked"]).optional(),
    page: z19.coerce.number().int().min(1).default(1),
    limit: z19.coerce.number().int().min(1).max(100).default(20)
  })
});

// src/modules/quizCertificates/quiz.certificate.route.ts
var router27 = Router27();
router27.get(
  "/verify/:certificateNumber",
  validateRequest_default(verifyCertificateValidation),
  quizCertificateController.verifyCertificate
);
router27.post(
  "/module/:moduleId/issue",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(issueCertificateValidation),
  quizCertificateController.issueMyCertificate
);
router27.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  quizCertificateController.getMyCertificates
);
router27.get(
  "/me/:certificateId",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(certificateIdValidation),
  quizCertificateController.getMySingleCertificate
);
router27.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(getAllCertificatesValidation),
  quizCertificateController.getAllCertificatesAdmin
);
router27.get(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(adminCertificateIdValidation),
  quizCertificateController.getSingleCertificateAdmin
);
router27.patch(
  "/:id/attach-url",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(attachCertificateUrlValidation),
  quizCertificateController.attachCertificateUrl
);
router27.patch(
  "/:id/revoke",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(revokeCertificateValidation),
  quizCertificateController.revokeCertificate
);
var quizCertificateRoutes = router27;

// src/modules/mentorshipProfiles/mentorship.profile.route.ts
import { Router as Router28 } from "express";

// src/modules/mentorshipProfiles/mentorship.profile.service.ts
import { Types as Types30 } from "mongoose";

// src/modules/mentorshipProfiles/mentorship.profile.model.schema.ts
import { model as model30, Schema as Schema30 } from "mongoose";

// src/modules/mentorshipProfiles/mentorship.profile.interface.ts
var MENTORSHIP_PROFILE_STATUSES = [
  "draft",
  "published",
  "archived"
];
var AVAILABILITY_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

// src/modules/mentorshipProfiles/mentorship.profile.model.schema.ts
var availabilitySlotSchema = new Schema30(
  {
    day: {
      type: String,
      enum: AVAILABILITY_DAYS,
      required: true,
      lowercase: true,
      trim: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true
    },
    endTime: {
      type: String,
      required: true,
      trim: true
    },
    timezone: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);
var mentorshipProfileSchema = new Schema30(
  {
    mentor: {
      type: Schema30.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    bio: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3e3
    },
    expertise: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100
        }
      ],
      default: []
    },
    availability: {
      type: [availabilitySlotSchema],
      default: []
    },
    profileImage: {
      type: String,
      trim: true
    },
    isPrimaryMentor: {
      type: Boolean,
      default: false,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 80
    },
    sessionDurationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 180
    },
    status: {
      type: String,
      enum: MENTORSHIP_PROFILE_STATUSES,
      default: "draft",
      index: true
    },
    order: {
      type: Number,
      default: 0
    },
    publishedAt: {
      type: Date
    },
    archivedAt: {
      type: Date
    },
    createdBy: {
      type: Schema30.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema30.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "mentorshipprofiles"
  }
);
mentorshipProfileSchema.index({
  isActive: 1,
  status: 1,
  order: 1
});
mentorshipProfileSchema.index({
  isPrimaryMentor: 1,
  isActive: 1
});
var MentorshipProfile = model30(
  "MentorshipProfile",
  mentorshipProfileSchema
);

// src/modules/mentorshipProfiles/mentorship.profile.service.ts
var throwServiceError16 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound16 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError16(message, statusCode);
  }
};
var assertValidObjectId10 = (value, fieldName) => {
  if (!Types30.ObjectId.isValid(value)) {
    throwServiceError16(`${fieldName} is invalid`, 400);
  }
};
var isAdminOrManager12 = (role) => {
  return role === "admin" || role === "manager";
};
var isDuplicateKeyError8 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var PROFILE_POPULATE = [
  {
    path: "mentor",
    select: "fullName email role profileImage"
  },
  {
    path: "createdBy",
    select: "fullName email role"
  },
  {
    path: "updatedBy",
    select: "fullName email role"
  }
];
var ensureMentorUserExists = async (mentorId) => {
  assertValidObjectId10(mentorId, "Mentor user ID");
  const mentorUser = await User.findById(mentorId).select("_id fullName email role");
  assertFound16(mentorUser, "Mentor user not found", 404);
  return mentorUser;
};
var clearOtherPrimaryMentors = async (excludeId) => {
  const filter = {
    isPrimaryMentor: true
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  await MentorshipProfile.updateMany(filter, {
    $set: { isPrimaryMentor: false }
  });
};
var createMentorshipProfile = async (payload, actorId) => {
  await ensureMentorUserExists(payload.mentor);
  const existingProfile = await MentorshipProfile.findOne({
    mentor: payload.mentor
  });
  if (existingProfile) {
    throwServiceError16(
      "A mentorship profile already exists for this mentor",
      409
    );
  }
  const createData = {
    mentor: new Types30.ObjectId(payload.mentor),
    bio: payload.bio,
    expertise: payload.expertise ?? [],
    availability: payload.availability ?? [],
    isPrimaryMentor: payload.isPrimaryMentor ?? false,
    sessionDurationMinutes: payload.sessionDurationMinutes ?? 60,
    order: payload.order ?? 0,
    status: "draft",
    createdBy: new Types30.ObjectId(actorId)
  };
  if (payload.profileImage !== void 0) {
    createData.profileImage = payload.profileImage;
  }
  if (payload.yearsOfExperience !== void 0) {
    createData.yearsOfExperience = payload.yearsOfExperience;
  }
  try {
    const profile = await MentorshipProfile.create(createData);
    if (profile.isPrimaryMentor) {
      await clearOtherPrimaryMentors(profile._id);
    }
    return profile.populate(PROFILE_POPULATE);
  } catch (error) {
    if (isDuplicateKeyError8(error)) {
      throwServiceError16(
        "A mentorship profile already exists for this mentor",
        409
      );
    }
    throw error;
  }
};
var getAllMentorshipProfiles = async ({
  actorRole,
  isActive
}) => {
  const filter = {};
  if (!isAdminOrManager12(actorRole)) {
    filter.status = "published";
    filter.isActive = true;
  } else if (isActive !== void 0) {
    filter.isActive = isActive;
  }
  return MentorshipProfile.find(filter).sort({ isPrimaryMentor: -1, order: 1, createdAt: 1 }).populate(PROFILE_POPULATE);
};
var getPrimaryMentor = async () => {
  const profile = await MentorshipProfile.findOne({
    isPrimaryMentor: true,
    isActive: true,
    status: "published"
  }).populate(PROFILE_POPULATE);
  assertFound16(profile, "No primary mentor is currently configured", 404);
  return profile;
};
var getSingleMentorshipProfile = async (profileId, actorRole) => {
  assertValidObjectId10(profileId, "Mentorship profile ID");
  const filter = {
    _id: profileId
  };
  if (!isAdminOrManager12(actorRole)) {
    filter.status = "published";
    filter.isActive = true;
  }
  const profile = await MentorshipProfile.findOne(filter).populate(
    PROFILE_POPULATE
  );
  assertFound16(profile, "Mentorship profile not found", 404);
  return profile;
};
var updateMentorshipProfile = async (profileId, payload, actorId) => {
  assertValidObjectId10(profileId, "Mentorship profile ID");
  const profile = await MentorshipProfile.findById(profileId);
  assertFound16(profile, "Mentorship profile not found", 404);
  if (payload.bio !== void 0) {
    profile.bio = payload.bio;
  }
  if (payload.expertise !== void 0) {
    profile.expertise = payload.expertise;
  }
  if (payload.availability !== void 0) {
    profile.availability = payload.availability;
  }
  if (payload.profileImage === null) {
    profile.set("profileImage", void 0);
  } else if (payload.profileImage !== void 0) {
    profile.profileImage = payload.profileImage;
  }
  if (payload.isActive !== void 0) {
    profile.isActive = payload.isActive;
  }
  if (payload.yearsOfExperience !== void 0) {
    profile.yearsOfExperience = payload.yearsOfExperience;
  }
  if (payload.sessionDurationMinutes !== void 0) {
    profile.sessionDurationMinutes = payload.sessionDurationMinutes;
  }
  if (payload.order !== void 0) {
    profile.order = payload.order;
  }
  if (payload.isPrimaryMentor !== void 0) {
    profile.isPrimaryMentor = payload.isPrimaryMentor;
  }
  profile.updatedBy = new Types30.ObjectId(actorId);
  await profile.save();
  if (profile.isPrimaryMentor) {
    await clearOtherPrimaryMentors(profile._id);
  }
  return profile.populate(PROFILE_POPULATE);
};
var publishMentorshipProfile = async (profileId, actorId) => {
  assertValidObjectId10(profileId, "Mentorship profile ID");
  const profile = await MentorshipProfile.findById(profileId);
  assertFound16(profile, "Mentorship profile not found", 404);
  if (profile.status === "archived") {
    throwServiceError16("Archived mentorship profile cannot be published", 400);
  }
  profile.status = "published";
  profile.publishedAt = /* @__PURE__ */ new Date();
  profile.set("archivedAt", void 0);
  profile.updatedBy = new Types30.ObjectId(actorId);
  await profile.save();
  return profile.populate(PROFILE_POPULATE);
};
var moveMentorshipProfileToDraft = async (profileId, actorId) => {
  assertValidObjectId10(profileId, "Mentorship profile ID");
  const profile = await MentorshipProfile.findById(profileId);
  assertFound16(profile, "Mentorship profile not found", 404);
  if (profile.status === "archived") {
    throwServiceError16(
      "Archived mentorship profile cannot be moved to draft",
      400
    );
  }
  profile.status = "draft";
  profile.set("publishedAt", void 0);
  profile.updatedBy = new Types30.ObjectId(actorId);
  await profile.save();
  return profile.populate(PROFILE_POPULATE);
};
var archiveMentorshipProfile = async (profileId, actorId) => {
  assertValidObjectId10(profileId, "Mentorship profile ID");
  const profile = await MentorshipProfile.findById(profileId);
  assertFound16(profile, "Mentorship profile not found", 404);
  profile.status = "archived";
  profile.archivedAt = /* @__PURE__ */ new Date();
  profile.isActive = false;
  profile.isPrimaryMentor = false;
  profile.set("publishedAt", void 0);
  profile.updatedBy = new Types30.ObjectId(actorId);
  await profile.save();
  return profile.populate(PROFILE_POPULATE);
};
var mentorshipProfileService = {
  createMentorshipProfile,
  getAllMentorshipProfiles,
  getPrimaryMentor,
  getSingleMentorshipProfile,
  updateMentorshipProfile,
  publishMentorshipProfile,
  moveMentorshipProfileToDraft,
  archiveMentorshipProfile
};

// src/modules/mentorshipProfiles/mentorship.profile.controller.ts
var getAuthUser15 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createMentorshipProfile2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser15(req);
    const profile = await mentorshipProfileService.createMentorshipProfile(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Mentorship profile created successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
var getAllMentorshipProfiles2 = async (req, res, next) => {
  try {
    const authUser = req.user ? { role: req.user.role } : void 0;
    let isActive;
    if (req.query.isActive === "true" || req.query.isActive === "false") {
      isActive = req.query.isActive === "true";
    }
    const profiles = await mentorshipProfileService.getAllMentorshipProfiles({
      actorRole: authUser?.role,
      isActive
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profiles retrieved successfully",
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};
var getPrimaryMentor2 = async (req, res, next) => {
  try {
    const profile = await mentorshipProfileService.getPrimaryMentor();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Primary mentor retrieved successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
var getSingleMentorshipProfile2 = async (req, res, next) => {
  try {
    const actorRole = req.user?.role;
    const profile = await mentorshipProfileService.getSingleMentorshipProfile(
      String(req.params.id),
      actorRole
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile retrieved successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
var updateMentorshipProfile2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser15(req);
    const profile = await mentorshipProfileService.updateMentorshipProfile(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile updated successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
var publishMentorshipProfile2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser15(req);
    const profile = await mentorshipProfileService.publishMentorshipProfile(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile published successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
var moveMentorshipProfileToDraft2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser15(req);
    const profile = await mentorshipProfileService.moveMentorshipProfileToDraft(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile moved to draft successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
var archiveMentorshipProfile2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser15(req);
    const profile = await mentorshipProfileService.archiveMentorshipProfile(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile archived successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
var mentorshipProfileController = {
  createMentorshipProfile: createMentorshipProfile2,
  getAllMentorshipProfiles: getAllMentorshipProfiles2,
  getPrimaryMentor: getPrimaryMentor2,
  getSingleMentorshipProfile: getSingleMentorshipProfile2,
  updateMentorshipProfile: updateMentorshipProfile2,
  publishMentorshipProfile: publishMentorshipProfile2,
  moveMentorshipProfileToDraft: moveMentorshipProfileToDraft2,
  archiveMentorshipProfile: archiveMentorshipProfile2
};

// src/modules/mentorshipProfiles/mentorship.profile.validation.ts
import { z as z20 } from "zod";
var mongoObjectIdSchema12 = z20.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var availabilitySlotSchema2 = z20.object({
  day: z20.enum(AVAILABILITY_DAYS),
  startTime: z20.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "startTime must be in HH:mm format"),
  endTime: z20.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "endTime must be in HH:mm format"),
  timezone: z20.string().trim().min(1).max(60)
}).strict();
var createMentorshipProfileValidation = z20.object({
  body: z20.object({
    mentor: mongoObjectIdSchema12,
    bio: z20.string().trim().min(10).max(3e3),
    expertise: z20.array(z20.string().trim().min(1).max(100)).max(30).optional(),
    availability: z20.array(availabilitySlotSchema2).max(14).optional(),
    profileImage: z20.string().trim().url().optional(),
    isPrimaryMentor: z20.boolean().optional(),
    yearsOfExperience: z20.number().int().min(0).max(80).optional(),
    sessionDurationMinutes: z20.number().int().min(15).max(180).optional(),
    order: z20.number().int().min(0).optional()
  }).strict()
});
var updateMentorshipProfileValidation = z20.object({
  params: z20.object({
    id: mongoObjectIdSchema12
  }),
  body: z20.object({
    bio: z20.string().trim().min(10).max(3e3).optional(),
    expertise: z20.array(z20.string().trim().min(1).max(100)).max(30).optional(),
    availability: z20.array(availabilitySlotSchema2).max(14).optional(),
    profileImage: z20.string().trim().url().nullable().optional(),
    isPrimaryMentor: z20.boolean().optional(),
    isActive: z20.boolean().optional(),
    yearsOfExperience: z20.number().int().min(0).max(80).optional(),
    sessionDurationMinutes: z20.number().int().min(15).max(180).optional(),
    order: z20.number().int().min(0).optional()
  }).strict()
});
var mentorshipProfileIdValidation = z20.object({
  params: z20.object({
    id: mongoObjectIdSchema12
  })
});

// src/modules/mentorshipProfiles/mentorship.profile.route.ts
var router28 = Router28();
router28.get("/", mentorshipProfileController.getAllMentorshipProfiles);
router28.get("/primary", mentorshipProfileController.getPrimaryMentor);
router28.get(
  "/:id",
  validateRequest_default(mentorshipProfileIdValidation),
  mentorshipProfileController.getSingleMentorshipProfile
);
router28.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(createMentorshipProfileValidation),
  mentorshipProfileController.createMentorshipProfile
);
router28.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(updateMentorshipProfileValidation),
  mentorshipProfileController.updateMentorshipProfile
);
router28.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(mentorshipProfileIdValidation),
  mentorshipProfileController.publishMentorshipProfile
);
router28.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(mentorshipProfileIdValidation),
  mentorshipProfileController.moveMentorshipProfileToDraft
);
router28.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(mentorshipProfileIdValidation),
  mentorshipProfileController.archiveMentorshipProfile
);
var mentorshipProfileRoutes = router28;

// src/modules/mentorshipReviews/mentorship.review.route.ts
import { Router as Router29 } from "express";

// src/modules/mentorshipReviews/mentorship.review.service.ts
import mongoose3, { Types as Types31 } from "mongoose";

// src/modules/mentorshipReviews/mentorship.review.model.schema.ts
import { model as model31, Schema as Schema31 } from "mongoose";

// src/modules/mentorshipReviews/mentorship.review.interface.ts
var MENTORSHIP_REVIEW_STATUSES = [
  "published",
  "hidden",
  "flagged"
];

// src/modules/mentorshipReviews/mentorship.review.model.schema.ts
var mentorshipReviewSchema = new Schema31(
  {
    booking: {
      type: Schema31.Types.ObjectId,
      ref: "MentorBooking",
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: Schema31.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    mentor: {
      type: Schema31.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    mentorshipProfile: {
      type: Schema31.Types.ObjectId,
      ref: "MentorshipProfile",
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2e3
    },
    status: {
      type: String,
      enum: MENTORSHIP_REVIEW_STATUSES,
      default: "published",
      index: true
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    moderatedBy: {
      type: Schema31.Types.ObjectId,
      ref: "User"
    },
    moderatedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: "mentorshipreviews"
  }
);
mentorshipReviewSchema.index({
  mentor: 1,
  status: 1,
  createdAt: -1
});
mentorshipReviewSchema.index({
  user: 1,
  createdAt: -1
});
mentorshipReviewSchema.index({
  mentorshipProfile: 1,
  status: 1
});
mentorshipReviewSchema.index({
  rating: 1,
  status: 1
});
var MentorshipReview = model31(
  "MentorshipReview",
  mentorshipReviewSchema
);

// src/modules/mentorshipReviews/mentorship.review.service.ts
var throwServiceError17 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound17 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError17(message, statusCode);
  }
};
var assertValidObjectId11 = (value, fieldName) => {
  if (!Types31.ObjectId.isValid(value)) {
    throwServiceError17(`${fieldName} is invalid`, 400);
  }
};
var isDuplicateKeyError9 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var getReviewPopulate = () => {
  const populateList = [
    {
      path: "user",
      select: "fullName email profileImage role"
    },
    {
      path: "mentor",
      select: "fullName email profileImage role"
    },
    {
      path: "mentorshipProfile",
      select: "bio expertise isPrimaryMentor sessionDurationMinutes profileImage"
    },
    {
      path: "moderatedBy",
      select: "fullName email role"
    }
  ];
  if (mongoose3.models.MentorBooking) {
    populateList.push({
      path: "booking",
      select: "status sessionDate startTime endTime timeZone meetingLink"
    });
  }
  return populateList;
};
var ensureMentorUserExists2 = async (mentorId) => {
  assertValidObjectId11(mentorId, "Mentor ID");
  const mentor = await User.findById(mentorId).select(
    "_id fullName email role profileImage"
  );
  assertFound17(mentor, "Mentor user not found", 404);
  return mentor;
};
var verifyBookingForReview = async (bookingId, userId, mentorId) => {
  assertValidObjectId11(bookingId, "Booking ID");
  if (mongoose3.models.MentorBooking) {
    const booking = await mongoose3.model("MentorBooking").findById(bookingId).lean();
    assertFound17(booking, "Mentorship booking not found", 404);
    const bookingUserId = (booking.user || booking.mentee || booking.client)?.toString();
    if (bookingUserId && bookingUserId !== userId) {
      throwServiceError17(
        "You can only review mentorship sessions booked by yourself",
        403
      );
    }
    const bookingMentorId = booking.mentor?.toString();
    if (bookingMentorId && bookingMentorId !== mentorId) {
      throwServiceError17(
        "The specified mentor does not match this booking record",
        400
      );
    }
    if (booking.status && booking.status !== "completed") {
      throwServiceError17(
        `Reviews are only permitted for completed sessions. Current status: ${booking.status}`,
        400
      );
    }
  }
};
var createReview = async (payload, userId) => {
  assertValidObjectId11(payload.booking, "Booking ID");
  assertValidObjectId11(payload.mentor, "Mentor ID");
  if (payload.mentor === userId) {
    throwServiceError17("Mentors cannot submit reviews for themselves", 400);
  }
  await ensureMentorUserExists2(payload.mentor);
  await verifyBookingForReview(payload.booking, userId, payload.mentor);
  const existingReview = await MentorshipReview.findOne({
    booking: new Types31.ObjectId(payload.booking)
  });
  if (existingReview) {
    throwServiceError17(
      "A review has already been submitted for this mentorship booking",
      409
    );
  }
  let mentorshipProfileId = payload.mentorshipProfile;
  if (!mentorshipProfileId) {
    const profile = await MentorshipProfile.findOne({
      mentor: new Types31.ObjectId(payload.mentor)
    }).select("_id");
    if (profile) {
      mentorshipProfileId = profile._id.toString();
    }
  }
  const createData = {
    booking: new Types31.ObjectId(payload.booking),
    user: new Types31.ObjectId(userId),
    mentor: new Types31.ObjectId(payload.mentor),
    rating: payload.rating,
    status: "published",
    isAnonymous: payload.isAnonymous ?? false,
    helpfulCount: 0
  };
  if (mentorshipProfileId) {
    assertValidObjectId11(mentorshipProfileId, "Mentorship profile ID");
    createData.mentorshipProfile = new Types31.ObjectId(mentorshipProfileId);
  }
  if (payload.comment) {
    createData.comment = payload.comment.trim();
  }
  try {
    const review = await MentorshipReview.create(createData);
    return review.populate(getReviewPopulate());
  } catch (error) {
    if (isDuplicateKeyError9(error)) {
      throwServiceError17(
        "A review has already been submitted for this mentorship booking",
        409
      );
    }
    throw error;
  }
};
var getReviewsForMentor = async (mentorId, options2) => {
  assertValidObjectId11(mentorId, "Mentor ID");
  const page = Math.max(1, options2?.page ?? 1);
  const limit = Math.max(1, Math.min(50, options2?.limit ?? 10));
  const skip = (page - 1) * limit;
  let filter = {
    $or: [
      { mentor: new Types31.ObjectId(mentorId) },
      { mentorshipProfile: new Types31.ObjectId(mentorId) }
    ],
    status: "published"
  };
  const [reviews, total, aggregateStats] = await Promise.all([
    MentorshipReview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(getReviewPopulate()),
    MentorshipReview.countDocuments(filter),
    MentorshipReview.aggregate([
      {
        $match: {
          $or: [
            { mentor: new Types31.ObjectId(mentorId) },
            { mentorshipProfile: new Types31.ObjectId(mentorId) }
          ],
          status: "published"
        }
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ])
  ]);
  const ratingBreakdown = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };
  let totalScore = 0;
  let totalReviewCount = 0;
  for (const item of aggregateStats) {
    const star = item._id;
    if (star >= 1 && star <= 5) {
      ratingBreakdown[star] = item.count;
      totalScore += star * item.count;
      totalReviewCount += item.count;
    }
  }
  const averageRating = totalReviewCount > 0 ? Number((totalScore / totalReviewCount).toFixed(1)) : 0;
  const stats = {
    averageRating,
    totalReviews: totalReviewCount,
    ratingBreakdown
  };
  const sanitizedReviews = reviews.map((rev) => {
    const doc = rev.toObject();
    if (doc.isAnonymous) {
      doc.user = {
        fullName: "Anonymous Member",
        role: "we_club_member"
      };
    }
    return doc;
  });
  return {
    stats,
    data: sanitizedReviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getMyReviews = async (userId, options2) => {
  assertValidObjectId11(userId, "User ID");
  const page = Math.max(1, options2?.page ?? 1);
  const limit = Math.max(1, Math.min(50, options2?.limit ?? 10));
  const skip = (page - 1) * limit;
  const filter = { user: new Types31.ObjectId(userId) };
  const [reviews, total] = await Promise.all([
    MentorshipReview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(getReviewPopulate()),
    MentorshipReview.countDocuments(filter)
  ]);
  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getSingleReview = async (reviewId, actorUserId, actorRole) => {
  assertValidObjectId11(reviewId, "Review ID");
  const review = await MentorshipReview.findById(reviewId).populate(
    getReviewPopulate()
  );
  assertFound17(review, "Mentorship review not found", 404);
  const isOwner = actorUserId && review.user.toString() === actorUserId;
  const isAdmin = actorRole === "founder" || actorRole === "manager" || actorRole === "admin" || actorRole === "super_admin";
  if (review.status !== "published" && !isOwner && !isAdmin) {
    throwServiceError17("Mentorship review not found", 404);
  }
  const doc = review.toObject();
  if (doc.isAnonymous && !isOwner && !isAdmin) {
    doc.user = {
      fullName: "Anonymous Member",
      role: "we_club_member"
    };
  }
  return doc;
};
var updateReview = async (reviewId, payload, userId) => {
  assertValidObjectId11(reviewId, "Review ID");
  const review = await MentorshipReview.findById(reviewId);
  assertFound17(review, "Mentorship review not found", 404);
  if (review.user.toString() !== userId) {
    throwServiceError17(
      "You are not authorized to update another user's review",
      403
    );
  }
  if (payload.rating !== void 0) {
    review.rating = payload.rating;
  }
  if (payload.comment === null) {
    review.set("comment", void 0);
  } else if (payload.comment !== void 0) {
    review.comment = payload.comment.trim();
  }
  if (payload.isAnonymous !== void 0) {
    review.isAnonymous = payload.isAnonymous;
  }
  await review.save();
  return review.populate(getReviewPopulate());
};
var deleteReview = async (reviewId, userId) => {
  assertValidObjectId11(reviewId, "Review ID");
  const review = await MentorshipReview.findById(reviewId);
  assertFound17(review, "Mentorship review not found", 404);
  if (review.user.toString() !== userId) {
    throwServiceError17(
      "You are not authorized to delete another user's review",
      403
    );
  }
  await MentorshipReview.findByIdAndDelete(reviewId);
  return { id: reviewId, deleted: true };
};
var getAllReviewsAdmin = async (query) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const skip = (page - 1) * limit;
  const filter = {};
  if (query.mentor) {
    assertValidObjectId11(query.mentor, "Mentor ID");
    filter.mentor = new Types31.ObjectId(query.mentor);
  }
  if (query.user) {
    assertValidObjectId11(query.user, "User ID");
    filter.user = new Types31.ObjectId(query.user);
  }
  if (query.booking) {
    assertValidObjectId11(query.booking, "Booking ID");
    filter.booking = new Types31.ObjectId(query.booking);
  }
  if (query.mentorshipProfile) {
    assertValidObjectId11(query.mentorshipProfile, "Mentorship Profile ID");
    filter.mentorshipProfile = new Types31.ObjectId(query.mentorshipProfile);
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.rating) {
    filter.rating = query.rating;
  }
  const sortField = query.sortBy || "createdAt";
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const [reviews, total] = await Promise.all([
    MentorshipReview.find(filter).sort({ [sortField]: sortDirection }).skip(skip).limit(limit).populate(getReviewPopulate()),
    MentorshipReview.countDocuments(filter)
  ]);
  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var moderateReview = async (reviewId, payload, adminId) => {
  assertValidObjectId11(reviewId, "Review ID");
  const review = await MentorshipReview.findById(reviewId);
  assertFound17(review, "Mentorship review not found", 404);
  review.status = payload.status;
  review.moderatedBy = new Types31.ObjectId(adminId);
  review.moderatedAt = /* @__PURE__ */ new Date();
  if (payload.adminNotes !== void 0) {
    review.adminNotes = payload.adminNotes;
  }
  await review.save();
  return review.populate(getReviewPopulate());
};
var deleteReviewAdmin = async (reviewId) => {
  assertValidObjectId11(reviewId, "Review ID");
  const review = await MentorshipReview.findByIdAndDelete(reviewId);
  assertFound17(review, "Mentorship review not found", 404);
  return { id: reviewId, deleted: true };
};
var mentorshipReviewService = {
  createReview,
  getReviewsForMentor,
  getMyReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  moderateReview,
  deleteReviewAdmin
};

// src/modules/mentorshipReviews/mentorship.review.controller.ts
var getAuthUser16 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createReview2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser16(req);
    const review = await mentorshipReviewService.createReview(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Mentorship review submitted successfully",
      data: review
    });
  } catch (error) {
    next(error);
  }
};
var getReviewsForMentor2 = async (req, res, next) => {
  try {
    const mentorId = String(req.params.mentorId);
    const page = req.query.page ? Number(req.query.page) : void 0;
    const limit = req.query.limit ? Number(req.query.limit) : void 0;
    const result = await mentorshipReviewService.getReviewsForMentor(mentorId, {
      page,
      limit
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor reviews retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyReviews2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser16(req);
    const page = req.query.page ? Number(req.query.page) : void 0;
    const limit = req.query.limit ? Number(req.query.limit) : void 0;
    const result = await mentorshipReviewService.getMyReviews(authUser.id, {
      page,
      limit
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "My mentorship reviews retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleReview2 = async (req, res, next) => {
  try {
    const reviewId = String(req.params.id);
    const actorUserId = req.user?.id;
    const actorRole = req.user?.role;
    const review = await mentorshipReviewService.getSingleReview(
      reviewId,
      actorUserId,
      actorRole
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review retrieved successfully",
      data: review
    });
  } catch (error) {
    next(error);
  }
};
var updateReview2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser16(req);
    const reviewId = String(req.params.id);
    const review = await mentorshipReviewService.updateReview(
      reviewId,
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review updated successfully",
      data: review
    });
  } catch (error) {
    next(error);
  }
};
var deleteReview2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser16(req);
    const reviewId = String(req.params.id);
    const result = await mentorshipReviewService.deleteReview(
      reviewId,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllReviewsAdmin2 = async (req, res, next) => {
  try {
    const query = {
      mentor: req.query.mentor,
      user: req.query.user,
      booking: req.query.booking,
      mentorshipProfile: req.query.mentorshipProfile,
      status: req.query.status,
      rating: req.query.rating ? Number(req.query.rating) : void 0,
      page: req.query.page ? Number(req.query.page) : void 0,
      limit: req.query.limit ? Number(req.query.limit) : void 0,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };
    const result = await mentorshipReviewService.getAllReviewsAdmin(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All mentorship reviews retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var moderateReview2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser16(req);
    const reviewId = String(req.params.id);
    const review = await mentorshipReviewService.moderateReview(
      reviewId,
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review moderated successfully",
      data: review
    });
  } catch (error) {
    next(error);
  }
};
var deleteReviewAdmin2 = async (req, res, next) => {
  try {
    const reviewId = String(req.params.id);
    const result = await mentorshipReviewService.deleteReviewAdmin(reviewId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review deleted by admin successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var mentorshipReviewController = {
  createReview: createReview2,
  getReviewsForMentor: getReviewsForMentor2,
  getMyReviews: getMyReviews2,
  getSingleReview: getSingleReview2,
  updateReview: updateReview2,
  deleteReview: deleteReview2,
  getAllReviewsAdmin: getAllReviewsAdmin2,
  moderateReview: moderateReview2,
  deleteReviewAdmin: deleteReviewAdmin2
};

// src/modules/mentorshipReviews/mentorship.review.validation.ts
import { z as z21 } from "zod";
var mongoObjectIdSchema13 = z21.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var createMentorshipReviewValidation = z21.object({
  body: z21.object({
    booking: mongoObjectIdSchema13,
    mentor: mongoObjectIdSchema13,
    mentorshipProfile: mongoObjectIdSchema13.optional(),
    rating: z21.number().int().min(1).max(5),
    comment: z21.string().trim().max(2e3).optional(),
    isAnonymous: z21.boolean().optional()
  }).strict()
});
var updateMentorshipReviewValidation = z21.object({
  params: z21.object({
    id: mongoObjectIdSchema13
  }),
  body: z21.object({
    rating: z21.number().int().min(1).max(5).optional(),
    comment: z21.string().trim().max(2e3).nullable().optional(),
    isAnonymous: z21.boolean().optional()
  }).strict()
});
var moderateMentorshipReviewValidation = z21.object({
  params: z21.object({
    id: mongoObjectIdSchema13
  }),
  body: z21.object({
    status: z21.enum(MENTORSHIP_REVIEW_STATUSES),
    adminNotes: z21.string().trim().max(1e3).optional()
  }).strict()
});
var mentorshipReviewIdValidation = z21.object({
  params: z21.object({
    id: mongoObjectIdSchema13
  })
});
var mentorIdParamValidation = z21.object({
  params: z21.object({
    mentorId: mongoObjectIdSchema13
  })
});

// src/modules/mentorshipReviews/mentorship.review.route.ts
var router29 = Router29();
router29.get(
  "/mentor/:mentorId",
  validateRequest_default(mentorIdParamValidation),
  mentorshipReviewController.getReviewsForMentor
);
router29.post(
  "/",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(createMentorshipReviewValidation),
  mentorshipReviewController.createReview
);
router29.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  mentorshipReviewController.getMyReviews
);
router29.patch(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(updateMentorshipReviewValidation),
  mentorshipReviewController.updateReview
);
router29.delete(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(mentorshipReviewIdValidation),
  mentorshipReviewController.deleteReview
);
router29.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  mentorshipReviewController.getAllReviewsAdmin
);
router29.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest_default(moderateMentorshipReviewValidation),
  mentorshipReviewController.moderateReview
);
router29.delete(
  "/:id/admin",
  verifyToken,
  authorizeRoles("founder", "manager", "admin", "super_admin"),
  validateRequest_default(mentorshipReviewIdValidation),
  mentorshipReviewController.deleteReviewAdmin
);
router29.get(
  "/:id",
  validateRequest_default(mentorshipReviewIdValidation),
  mentorshipReviewController.getSingleReview
);
var mentorshipReviewRoutes = router29;

// src/modules/retreatLocations/retreat.location.route.ts
import { Router as Router30 } from "express";

// src/modules/retreatLocations/retreat.location.service.ts
import { Types as Types32 } from "mongoose";

// src/modules/retreatLocations/retreat.location.model.schema.ts
import { model as model32, Schema as Schema32 } from "mongoose";

// src/modules/retreatLocations/retreat.location.interface.ts
var RETREAT_LOCATION_STATUSES = [
  "draft",
  "published",
  "archived"
];

// src/modules/retreatLocations/retreat.location.model.schema.ts
var retreatLocationSchema = new Schema32(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 300
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5e3
    },
    coverImage: {
      type: String,
      trim: true
    },
    promoVideoUrl: {
      type: String,
      trim: true
    },
    galleryImages: {
      type: [{ type: String, trim: true }],
      default: []
    },
    whatsIncluded: {
      type: [{ type: String, trim: true }],
      default: []
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    status: {
      type: String,
      enum: RETREAT_LOCATION_STATUSES,
      default: "published",
      index: true
    },
    order: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: Schema32.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema32.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "retreatlocations"
  }
);
retreatLocationSchema.index({
  isActive: 1,
  status: 1,
  order: 1
});
var RetreatLocation = model32(
  "RetreatLocation",
  retreatLocationSchema
);

// src/modules/retreatLocations/retreat.location.service.ts
var throwServiceError18 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound18 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError18(message, statusCode);
  }
};
var assertValidObjectId12 = (value, fieldName) => {
  if (!Types32.ObjectId.isValid(value)) {
    throwServiceError18(`${fieldName} is invalid`, 400);
  }
};
var slugify = (text) => {
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-");
};
var LOCATION_POPULATE = [
  {
    path: "createdBy",
    select: "fullName email role"
  },
  {
    path: "updatedBy",
    select: "fullName email role"
  }
];
var createRetreatLocation = async (payload, actorId) => {
  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
  const existing = await RetreatLocation.findOne({ slug });
  if (existing) {
    throwServiceError18("A retreat location with this slug already exists", 409);
  }
  const createData = {
    title: payload.title,
    slug,
    country: payload.country,
    city: payload.city,
    description: payload.description,
    galleryImages: payload.galleryImages ?? [],
    whatsIncluded: payload.whatsIncluded ?? [],
    isFeatured: payload.isFeatured ?? false,
    isActive: payload.isActive ?? true,
    status: payload.status ?? "published",
    order: payload.order ?? 0,
    createdBy: new Types32.ObjectId(actorId)
  };
  if (payload.tagline !== void 0) {
    createData.tagline = payload.tagline;
  }
  if (payload.coverImage !== void 0) {
    createData.coverImage = payload.coverImage;
  }
  if (payload.promoVideoUrl !== void 0) {
    createData.promoVideoUrl = payload.promoVideoUrl;
  }
  const location = await RetreatLocation.create(createData);
  return location.populate(LOCATION_POPULATE);
};
var getAllRetreatLocations = async (query = {}, isPublicOnly = false) => {
  const filter = {};
  if (isPublicOnly) {
    filter.status = "published";
    filter.isActive = true;
  } else {
    if (query.status) {
      filter.status = query.status;
    }
    if (query.isActive !== void 0) {
      filter.isActive = query.isActive;
    }
  }
  if (query.isFeatured !== void 0) {
    filter.isFeatured = query.isFeatured;
  }
  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [{ title: regex }, { city: regex }, { country: regex }];
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [locations, total] = await Promise.all([
    RetreatLocation.find(filter).sort({ isFeatured: -1, order: 1, createdAt: -1 }).skip(skip).limit(limit).populate(LOCATION_POPULATE),
    RetreatLocation.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: locations
  };
};
var getSingleRetreatLocation = async (idOrSlug, isPublicOnly = false) => {
  const filter = {};
  if (Types32.ObjectId.isValid(idOrSlug)) {
    filter._id = new Types32.ObjectId(idOrSlug);
  } else {
    filter.slug = idOrSlug.toLowerCase();
  }
  if (isPublicOnly) {
    filter.status = "published";
    filter.isActive = true;
  }
  const location = await RetreatLocation.findOne(filter).populate(
    LOCATION_POPULATE
  );
  assertFound18(location, "Retreat location not found", 404);
  return location;
};
var updateRetreatLocation = async (locationId, payload, actorId) => {
  assertValidObjectId12(locationId, "Retreat location ID");
  const location = await RetreatLocation.findById(locationId);
  assertFound18(location, "Retreat location not found", 404);
  if (payload.title !== void 0) {
    location.title = payload.title;
  }
  if (payload.slug !== void 0) {
    const slug = slugify(payload.slug);
    const existing = await RetreatLocation.findOne({
      slug,
      _id: { $ne: location._id }
    });
    if (existing) {
      throwServiceError18("A retreat location with this slug already exists", 409);
    }
    location.slug = slug;
  }
  if (payload.country !== void 0) {
    location.country = payload.country;
  }
  if (payload.city !== void 0) {
    location.city = payload.city;
  }
  if (payload.tagline !== void 0) {
    location.tagline = payload.tagline;
  }
  if (payload.description !== void 0) {
    location.description = payload.description;
  }
  if (payload.coverImage === null) {
    location.set("coverImage", void 0);
  } else if (payload.coverImage !== void 0) {
    location.coverImage = payload.coverImage;
  }
  if (payload.promoVideoUrl === null) {
    location.set("promoVideoUrl", void 0);
  } else if (payload.promoVideoUrl !== void 0) {
    location.promoVideoUrl = payload.promoVideoUrl;
  }
  if (payload.galleryImages !== void 0) {
    location.galleryImages = payload.galleryImages;
  }
  if (payload.whatsIncluded !== void 0) {
    location.whatsIncluded = payload.whatsIncluded;
  }
  if (payload.isFeatured !== void 0) {
    location.isFeatured = payload.isFeatured;
  }
  if (payload.isActive !== void 0) {
    location.isActive = payload.isActive;
  }
  if (payload.status !== void 0) {
    location.status = payload.status;
  }
  if (payload.order !== void 0) {
    location.order = payload.order;
  }
  location.updatedBy = new Types32.ObjectId(actorId);
  await location.save();
  return location.populate(LOCATION_POPULATE);
};
var deleteRetreatLocation = async (locationId) => {
  assertValidObjectId12(locationId, "Retreat location ID");
  const location = await RetreatLocation.findById(locationId);
  assertFound18(location, "Retreat location not found", 404);
  await location.deleteOne();
  return { success: true, message: "Retreat location deleted successfully" };
};
var retreatLocationService = {
  createRetreatLocation,
  getAllRetreatLocations,
  getSingleRetreatLocation,
  updateRetreatLocation,
  deleteRetreatLocation
};

// src/modules/retreatLocations/retreat.location.controller.ts
var getAuthUser17 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createRetreatLocation2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser17(req);
    const location = await retreatLocationService.createRetreatLocation(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Retreat location created successfully",
      data: location
    });
  } catch (error) {
    next(error);
  }
};
var getAllRetreatLocations2 = async (req, res, next) => {
  try {
    const isPublicOnly = !req.user || req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager";
    const result = await retreatLocationService.getAllRetreatLocations(
      req.query,
      isPublicOnly
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat locations retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleRetreatLocation2 = async (req, res, next) => {
  try {
    const isPublicOnly = !req.user || req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager";
    const location = await retreatLocationService.getSingleRetreatLocation(
      String(req.params.idOrSlug),
      isPublicOnly
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location retrieved successfully",
      data: location
    });
  } catch (error) {
    next(error);
  }
};
var updateRetreatLocation2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser17(req);
    const location = await retreatLocationService.updateRetreatLocation(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location updated successfully",
      data: location
    });
  } catch (error) {
    next(error);
  }
};
var deleteRetreatLocation2 = async (req, res, next) => {
  try {
    getAuthUser17(req);
    const result = await retreatLocationService.deleteRetreatLocation(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
var retreatLocationController = {
  createRetreatLocation: createRetreatLocation2,
  getAllRetreatLocations: getAllRetreatLocations2,
  getSingleRetreatLocation: getSingleRetreatLocation2,
  updateRetreatLocation: updateRetreatLocation2,
  deleteRetreatLocation: deleteRetreatLocation2
};

// src/modules/retreatLocations/retreat.location.validation.ts
import { z as z22 } from "zod";
var mongoObjectIdSchema14 = z22.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var createRetreatLocationValidation = z22.object({
  body: z22.object({
    title: z22.string().trim().min(2).max(200),
    slug: z22.string().trim().min(2).max(200).optional(),
    country: z22.string().trim().min(2).max(100),
    city: z22.string().trim().min(2).max(100),
    tagline: z22.string().trim().max(300).optional(),
    description: z22.string().trim().min(10).max(5e3),
    coverImage: z22.string().trim().url().optional(),
    promoVideoUrl: z22.string().trim().url().optional(),
    galleryImages: z22.array(z22.string().trim().url()).max(20).optional(),
    whatsIncluded: z22.array(z22.string().trim().min(1).max(300)).max(30).optional(),
    isFeatured: z22.boolean().optional(),
    isActive: z22.boolean().optional(),
    status: z22.enum(RETREAT_LOCATION_STATUSES).optional(),
    order: z22.number().int().min(0).optional()
  }).strict()
});
var updateRetreatLocationValidation = z22.object({
  params: z22.object({
    id: mongoObjectIdSchema14
  }),
  body: z22.object({
    title: z22.string().trim().min(2).max(200).optional(),
    slug: z22.string().trim().min(2).max(200).optional(),
    country: z22.string().trim().min(2).max(100).optional(),
    city: z22.string().trim().min(2).max(100).optional(),
    tagline: z22.string().trim().max(300).optional(),
    description: z22.string().trim().min(10).max(5e3).optional(),
    coverImage: z22.string().trim().url().nullable().optional(),
    promoVideoUrl: z22.string().trim().url().nullable().optional(),
    galleryImages: z22.array(z22.string().trim().url()).max(20).optional(),
    whatsIncluded: z22.array(z22.string().trim().min(1).max(300)).max(30).optional(),
    isFeatured: z22.boolean().optional(),
    isActive: z22.boolean().optional(),
    status: z22.enum(RETREAT_LOCATION_STATUSES).optional(),
    order: z22.number().int().min(0).optional()
  }).strict()
});
var retreatLocationIdValidation = z22.object({
  params: z22.object({
    id: mongoObjectIdSchema14
  })
});
var queryRetreatLocationValidation = z22.object({
  query: z22.object({
    status: z22.enum(RETREAT_LOCATION_STATUSES).optional(),
    isActive: z22.coerce.boolean().optional(),
    isFeatured: z22.coerce.boolean().optional(),
    search: z22.string().trim().optional(),
    page: z22.coerce.number().int().min(1).optional(),
    limit: z22.coerce.number().int().min(1).max(100).optional()
  }).optional()
});

// src/modules/retreatLocations/retreat.location.route.ts
var router30 = Router30();
router30.get(
  "/",
  validateRequest_default(queryRetreatLocationValidation),
  retreatLocationController.getAllRetreatLocations
);
router30.get(
  "/:idOrSlug",
  retreatLocationController.getSingleRetreatLocation
);
router30.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(createRetreatLocationValidation),
  retreatLocationController.createRetreatLocation
);
router30.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(updateRetreatLocationValidation),
  retreatLocationController.updateRetreatLocation
);
router30.delete(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(retreatLocationIdValidation),
  retreatLocationController.deleteRetreatLocation
);
var retreatLocationRoutes = router30;

// src/modules/leaderboardEntries/leaderboard.entry.route.ts
import { Router as Router31 } from "express";

// src/modules/leaderboardEntries/leaderboard.entry.service.ts
import mongoose5, { Types as Types34 } from "mongoose";

// src/modules/leaderboardEntries/leaderboard.entry.model.schema.ts
import { model as model33, Schema as Schema33 } from "mongoose";
var leaderboardEntrySchema = new Schema33(
  {
    leaderboard: {
      type: Schema33.Types.ObjectId,
      ref: "Leaderboard",
      required: true,
      index: true
    },
    user: {
      type: Schema33.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
      required: true
    },
    rank: {
      type: Number,
      default: null
    },
    breakdown: {
      type: Schema33.Types.Mixed,
      default: {}
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: true,
    collection: "leaderboardentries",
    optimisticConcurrency: true
  }
);
leaderboardEntrySchema.index(
  {
    leaderboard: 1,
    user: 1
  },
  {
    unique: true
  }
);
leaderboardEntrySchema.index({
  leaderboard: 1,
  points: -1
});
leaderboardEntrySchema.index({
  leaderboard: 1,
  rank: 1
});
var LeaderboardEntry = model33(
  "LeaderboardEntry",
  leaderboardEntrySchema
);

// src/modules/leaderboards/leaderboard.model.schema.ts
import { model as model34, Schema as Schema34 } from "mongoose";

// src/modules/leaderboards/leaderboard.interface.ts
var LEADERBOARD_TYPES = [
  "points",
  "streak",
  "course_completion",
  "quiz_score",
  "custom"
];
var LEADERBOARD_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "seasonal",
  "all_time"
];
var LEADERBOARD_STATUSES = [
  "draft",
  "active",
  "finalized",
  "archived"
];

// src/modules/leaderboards/leaderboard.model.schema.ts
var leaderboardSchema = new Schema34(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: LEADERBOARD_TYPES,
      required: true,
      index: true
    },
    period: {
      type: String,
      enum: LEADERBOARD_PERIODS,
      required: true,
      index: true
    },
    startAt: {
      type: Date,
      required: true
    },
    endAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: LEADERBOARD_STATUSES,
      default: "draft",
      required: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    createdBy: {
      type: Schema34.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema34.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    collection: "leaderboards",
    optimisticConcurrency: true
  }
);
leaderboardSchema.index(
  {
    type: 1,
    period: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "active"
    }
  }
);
leaderboardSchema.index({
  status: 1,
  createdAt: -1
});
var Leaderboard = model34("Leaderboard", leaderboardSchema);

// src/modules/leaderboards/leaderboard.service.ts
import mongoose4, { Types as Types33 } from "mongoose";
var assertValidObjectId13 = (value, fieldName) => {
  if (!Types33.ObjectId.isValid(value)) {
    throwServiceError_default(`${fieldName} is invalid`, 400);
  }
};
var isDuplicateKeyError10 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var createLeaderboard = async (payload, createdByUserId) => {
  assertValidObjectId13(createdByUserId, "User ID");
  if (new Date(payload.startAt) >= new Date(payload.endAt)) {
    throwServiceError_default("startAt must be before endAt", 400);
  }
  try {
    const leaderboard = await Leaderboard.create({
      title: payload.title,
      type: payload.type,
      period: payload.period,
      startAt: payload.startAt,
      endAt: payload.endAt,
      description: payload.description,
      status: "draft",
      createdBy: new Types33.ObjectId(createdByUserId),
      updatedBy: new Types33.ObjectId(createdByUserId)
    });
    return leaderboard;
  } catch (error) {
    if (isDuplicateKeyError10(error)) {
      throwServiceError_default(
        "An active leaderboard already exists for this type and period",
        409
      );
    }
    throw error;
  }
};
var getSingleLeaderboard = async (leaderboardId) => {
  assertValidObjectId13(leaderboardId, "Leaderboard ID");
  const leaderboard = await Leaderboard.findById(leaderboardId);
  assertFound_default(leaderboard, "Leaderboard not found", 404);
  return leaderboard;
};
var getAllLeaderboards = async (query) => {
  const filter = {};
  if (query.type) {
    filter.type = query.type;
  }
  if (query.period) {
    filter.period = query.period;
  }
  if (query.status) {
    filter.status = query.status;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    Leaderboard.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("createdBy", "fullName email role").populate("updatedBy", "fullName email role"),
    Leaderboard.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: records
  };
};
var updateLeaderboard = async (leaderboardId, payload, updatedByUserId) => {
  assertValidObjectId13(leaderboardId, "Leaderboard ID");
  assertValidObjectId13(updatedByUserId, "User ID");
  const leaderboard = await Leaderboard.findById(leaderboardId);
  assertFound_default(leaderboard, "Leaderboard not found", 404);
  if (leaderboard.status === "finalized") {
    throwServiceError_default("Finalized leaderboard cannot be edited", 400);
  }
  const nextStartAt = payload.startAt ?? leaderboard.startAt;
  const nextEndAt = payload.endAt ?? leaderboard.endAt;
  if (new Date(nextStartAt) >= new Date(nextEndAt)) {
    throwServiceError_default("startAt must be before endAt", 400);
  }
  if (payload.title !== void 0) {
    leaderboard.title = payload.title;
  }
  if (payload.description !== void 0) {
    leaderboard.description = payload.description;
  }
  if (payload.startAt !== void 0) {
    leaderboard.startAt = payload.startAt;
  }
  if (payload.endAt !== void 0) {
    leaderboard.endAt = payload.endAt;
  }
  leaderboard.updatedBy = new Types33.ObjectId(updatedByUserId);
  await leaderboard.save();
  return leaderboard;
};
var activateLeaderboard = async (leaderboardId, updatedByUserId) => {
  assertValidObjectId13(leaderboardId, "Leaderboard ID");
  assertValidObjectId13(updatedByUserId, "User ID");
  const leaderboard = await Leaderboard.findById(leaderboardId);
  assertFound_default(leaderboard, "Leaderboard not found", 404);
  if (leaderboard.status === "finalized") {
    throwServiceError_default("Finalized leaderboard cannot be reactivated", 400);
  }
  if (leaderboard.status === "active") {
    return leaderboard;
  }
  const existingActiveLeaderboard = await Leaderboard.findOne({
    _id: { $ne: leaderboard._id },
    type: leaderboard.type,
    period: leaderboard.period,
    status: "active"
  });
  if (existingActiveLeaderboard) {
    throwServiceError_default(
      `An active leaderboard already exists for type "${leaderboard.type}" and period "${leaderboard.period}"`,
      409
    );
  }
  leaderboard.status = "active";
  leaderboard.updatedBy = new Types33.ObjectId(updatedByUserId);
  try {
    await leaderboard.save();
  } catch (error) {
    if (isDuplicateKeyError10(error)) {
      throwServiceError_default(
        "An active leaderboard already exists for this type and period",
        409
      );
    }
    throw error;
  }
  return leaderboard;
};
var recalculateLeaderboardRanks = async (leaderboardId) => {
  const session = await mongoose4.startSession();
  try {
    session.startTransaction();
    const entries = await LeaderboardEntry.find({ leaderboard: leaderboardId }).sort({ points: -1, updatedAt: 1 }).session(session);
    const bulkOperations = entries.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { rank: index + 1 } }
      }
    }));
    if (bulkOperations.length > 0) {
      await LeaderboardEntry.bulkWrite(bulkOperations, { session });
    }
    await session.commitTransaction();
    return entries.length;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
var finalizeLeaderboard = async (leaderboardId, updatedByUserId) => {
  assertValidObjectId13(leaderboardId, "Leaderboard ID");
  assertValidObjectId13(updatedByUserId, "User ID");
  const leaderboard = await Leaderboard.findById(leaderboardId);
  assertFound_default(leaderboard, "Leaderboard not found", 404);
  if (leaderboard.status === "finalized") {
    return leaderboard;
  }
  await recalculateLeaderboardRanks(leaderboardId);
  leaderboard.status = "finalized";
  leaderboard.updatedBy = new Types33.ObjectId(updatedByUserId);
  await leaderboard.save();
  return leaderboard;
};
var leaderboardService = {
  createLeaderboard,
  getSingleLeaderboard,
  getAllLeaderboards,
  updateLeaderboard,
  activateLeaderboard,
  finalizeLeaderboard,
  recalculateLeaderboardRanks
};

// src/modules/leaderboardEntries/leaderboard.entry.service.ts
var assertValidObjectId14 = (value, fieldName) => {
  if (!Types34.ObjectId.isValid(value)) {
    throwServiceError_default(`${fieldName} is invalid`, 400);
  }
};
var ensureEditableLeaderboard = async (leaderboardId) => {
  assertValidObjectId14(leaderboardId, "Leaderboard ID");
  const leaderboard = await Leaderboard.findById(leaderboardId);
  assertFound_default(leaderboard, "Leaderboard not found", 404);
  if (leaderboard.status === "finalized") {
    throwServiceError_default("Finalized leaderboard cannot be modified", 400);
  }
  return leaderboard;
};
var upsertPoints = async (leaderboardId, payload) => {
  await ensureEditableLeaderboard(leaderboardId);
  assertValidObjectId14(payload.userId, "User ID");
  const session = await mongoose5.startSession();
  try {
    session.startTransaction();
    const incFields = {
      points: payload.pointsDelta
    };
    if (payload.breakdownKey) {
      incFields[`breakdown.${payload.breakdownKey}`] = payload.pointsDelta;
    }
    const entry = await LeaderboardEntry.findOneAndUpdate(
      {
        leaderboard: leaderboardId,
        user: payload.userId
      },
      {
        $inc: incFields,
        $set: { lastUpdatedAt: /* @__PURE__ */ new Date() }
      },
      {
        upsert: true,
        new: true,
        session,
        setDefaultsOnInsert: true
      }
    );
    await session.commitTransaction();
    return entry;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
var getLeaderboardEntries = async (leaderboardId, query) => {
  assertValidObjectId14(leaderboardId, "Leaderboard ID");
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    LeaderboardEntry.find({ leaderboard: leaderboardId }).sort({ rank: 1, points: -1 }).skip(skip).limit(limit).populate("user", "fullName email role profileImage"),
    LeaderboardEntry.countDocuments({ leaderboard: leaderboardId })
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: records
  };
};
var getSingleUserEntry = async (leaderboardId, userId) => {
  assertValidObjectId14(leaderboardId, "Leaderboard ID");
  assertValidObjectId14(userId, "User ID");
  const entry = await LeaderboardEntry.findOne({
    leaderboard: leaderboardId,
    user: userId
  }).populate("user", "fullName email role profileImage");
  assertFound_default(entry, "Entry not found for this user in this leaderboard", 404);
  return entry;
};
var getMyEntry = async (leaderboardId, userId) => {
  return getSingleUserEntry(leaderboardId, userId);
};
var removeEntry = async (leaderboardId, userId) => {
  await ensureEditableLeaderboard(leaderboardId);
  assertValidObjectId14(userId, "User ID");
  const entry = await LeaderboardEntry.findOneAndDelete({
    leaderboard: leaderboardId,
    user: userId
  });
  assertFound_default(entry, "Entry not found", 404);
  return entry;
};
var recalculateRanks = async (leaderboardId) => {
  await ensureEditableLeaderboard(leaderboardId);
  const updatedEntries = await leaderboardService.recalculateLeaderboardRanks(leaderboardId);
  return { updatedEntries };
};
var leaderboardEntryService = {
  upsertPoints,
  getLeaderboardEntries,
  getSingleUserEntry,
  getMyEntry,
  removeEntry,
  recalculateRanks
};

// src/modules/leaderboardEntries/leaderboard.entry.controller.ts
var getAuthUser18 = (req) => {
  const user = req.user;
  assertFound_default(user, "Authentication required", 401);
  return {
    id: user.id,
    role: user.role
  };
};
var upsertPoints2 = async (req, res, next) => {
  try {
    getAuthUser18(req);
    const result = await leaderboardEntryService.upsertPoints(
      String(req.params.leaderboardId),
      req.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard points updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getLeaderboardEntries2 = async (req, res, next) => {
  try {
    getAuthUser18(req);
    const query = {};
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await leaderboardEntryService.getLeaderboardEntries(
      String(req.params.leaderboardId),
      query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard entries retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyEntry2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser18(req);
    const result = await leaderboardEntryService.getMyEntry(
      String(req.params.leaderboardId),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Your leaderboard entry retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleUserEntry2 = async (req, res, next) => {
  try {
    getAuthUser18(req);
    const result = await leaderboardEntryService.getSingleUserEntry(
      String(req.params.leaderboardId),
      String(req.params.userId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User leaderboard entry retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var removeEntry2 = async (req, res, next) => {
  try {
    getAuthUser18(req);
    const result = await leaderboardEntryService.removeEntry(
      String(req.params.leaderboardId),
      String(req.params.userId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard entry removed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var recalculateRanks2 = async (req, res, next) => {
  try {
    getAuthUser18(req);
    const result = await leaderboardEntryService.recalculateRanks(
      String(req.params.leaderboardId)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard ranks recalculated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var leaderboardEntryController = {
  upsertPoints: upsertPoints2,
  getLeaderboardEntries: getLeaderboardEntries2,
  getMyEntry: getMyEntry2,
  getSingleUserEntry: getSingleUserEntry2,
  removeEntry: removeEntry2,
  recalculateRanks: recalculateRanks2
};

// src/modules/leaderboardEntries/leaderboard.entry.validation.ts
import { z as z23 } from "zod";
var mongoObjectIdSchema15 = z23.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var leaderboardIdParamValidation = z23.object({
  params: z23.object({
    leaderboardId: mongoObjectIdSchema15
  })
});
var leaderboardUserParamValidation = z23.object({
  params: z23.object({
    leaderboardId: mongoObjectIdSchema15,
    userId: mongoObjectIdSchema15
  })
});
var upsertLeaderboardPointsValidation = z23.object({
  params: z23.object({
    leaderboardId: mongoObjectIdSchema15
  }),
  body: z23.object({
    userId: mongoObjectIdSchema15,
    pointsDelta: z23.number().int(),
    breakdownKey: z23.string().trim().min(1).max(64).optional()
  })
});
var getLeaderboardEntriesValidation = z23.object({
  params: z23.object({
    leaderboardId: mongoObjectIdSchema15
  }),
  query: z23.object({
    page: z23.coerce.number().int().min(1).default(1),
    limit: z23.coerce.number().int().min(1).max(200).default(50)
  })
});

// src/modules/leaderboardEntries/leaderboard.entry.route.ts
var router31 = Router31({ mergeParams: true });
router31.post(
  "/:leaderboardId/entries",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(upsertLeaderboardPointsValidation),
  leaderboardEntryController.upsertPoints
);
router31.get(
  "/:leaderboardId/entries",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(getLeaderboardEntriesValidation),
  leaderboardEntryController.getLeaderboardEntries
);
router31.get(
  "/:leaderboardId/entries/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(leaderboardIdParamValidation),
  leaderboardEntryController.getMyEntry
);
router31.get(
  "/:leaderboardId/entries/:userId",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(leaderboardUserParamValidation),
  leaderboardEntryController.getSingleUserEntry
);
router31.delete(
  "/:leaderboardId/entries/:userId",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(leaderboardUserParamValidation),
  leaderboardEntryController.removeEntry
);
router31.post(
  "/:leaderboardId/recalculate",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(leaderboardIdParamValidation),
  leaderboardEntryController.recalculateRanks
);
var leaderboardEntryRoutes = router31;

// src/modules/leaderboards/leaderboard.route.ts
import { Router as Router32 } from "express";

// src/modules/leaderboards/leaderboard.controller.ts
var getAuthUser19 = (req) => {
  const user = req.user;
  assertFound_default(user, "Authentication required", 401);
  return {
    id: user.id,
    role: user.role
  };
};
var createLeaderboard2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser19(req);
    const result = await leaderboardService.createLeaderboard(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Leaderboard created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllLeaderboards2 = async (req, res, next) => {
  try {
    getAuthUser19(req);
    const query = {};
    if (typeof req.query.type === "string") {
      query.type = req.query.type;
    }
    if (typeof req.query.period === "string") {
      query.period = req.query.period;
    }
    if (typeof req.query.status === "string") {
      query.status = req.query.status;
    }
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await leaderboardService.getAllLeaderboards(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboards retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleLeaderboard2 = async (req, res, next) => {
  try {
    getAuthUser19(req);
    const result = await leaderboardService.getSingleLeaderboard(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateLeaderboard2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser19(req);
    const result = await leaderboardService.updateLeaderboard(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var activateLeaderboard2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser19(req);
    const result = await leaderboardService.activateLeaderboard(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard activated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var finalizeLeaderboard2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser19(req);
    const result = await leaderboardService.finalizeLeaderboard(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard finalized successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var leaderboardController = {
  createLeaderboard: createLeaderboard2,
  getAllLeaderboards: getAllLeaderboards2,
  getSingleLeaderboard: getSingleLeaderboard2,
  updateLeaderboard: updateLeaderboard2,
  activateLeaderboard: activateLeaderboard2,
  finalizeLeaderboard: finalizeLeaderboard2
};

// src/modules/leaderboards/leaderboard.validation.ts
import { z as z24 } from "zod";
var mongoObjectIdSchema16 = z24.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var leaderboardIdValidation = z24.object({
  params: z24.object({
    id: mongoObjectIdSchema16
  })
});
var createLeaderboardValidation = z24.object({
  body: z24.object({
    title: z24.string().trim().min(3).max(150),
    type: z24.enum(LEADERBOARD_TYPES),
    period: z24.enum(LEADERBOARD_PERIODS),
    startAt: z24.coerce.date(),
    endAt: z24.coerce.date(),
    description: z24.string().trim().max(1e3).optional()
  })
});
var updateLeaderboardValidation = z24.object({
  params: z24.object({
    id: mongoObjectIdSchema16
  }),
  body: z24.object({
    title: z24.string().trim().min(3).max(150).optional(),
    description: z24.string().trim().max(1e3).optional(),
    startAt: z24.coerce.date().optional(),
    endAt: z24.coerce.date().optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update"
  })
});
var getAllLeaderboardsValidation = z24.object({
  query: z24.object({
    type: z24.enum(LEADERBOARD_TYPES).optional(),
    period: z24.enum(LEADERBOARD_PERIODS).optional(),
    status: z24.enum(LEADERBOARD_STATUSES).optional(),
    page: z24.coerce.number().int().min(1).default(1),
    limit: z24.coerce.number().int().min(1).max(100).default(20)
  })
});

// src/modules/leaderboards/leaderboard.route.ts
var router32 = Router32();
router32.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(createLeaderboardValidation),
  leaderboardController.createLeaderboard
);
router32.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(getAllLeaderboardsValidation),
  leaderboardController.getAllLeaderboards
);
router32.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(leaderboardIdValidation),
  leaderboardController.getSingleLeaderboard
);
router32.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(updateLeaderboardValidation),
  leaderboardController.updateLeaderboard
);
router32.post(
  "/:id/activate",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(leaderboardIdValidation),
  leaderboardController.activateLeaderboard
);
router32.post(
  "/:id/finalize",
  verifyToken,
  authorizeRoles("founder", "manager"),
  validateRequest_default(leaderboardIdValidation),
  leaderboardController.finalizeLeaderboard
);
var leaderboardRoutes = router32;

// src/modules/mentorBookings/mentor.booking.route.ts
import { Router as Router33 } from "express";

// src/modules/mentorBookings/mentor.booking.validation.ts
import { z as z25 } from "zod";

// src/modules/mentorBookings/mentor.booking.interface.ts
var MENTOR_BOOKING_STATUSES = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show"
];
var NO_SHOW_PARTIES = ["member", "mentor", "both"];

// src/modules/mentorBookings/mentor.booking.validation.ts
var mongoObjectIdSchema17 = z25.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var createMentorBookingValidation = z25.object({
  body: z25.object({
    leadMentor: mongoObjectIdSchema17,
    leadMentorProfile: mongoObjectIdSchema17.optional(),
    coMentor: mongoObjectIdSchema17.optional(),
    coMentorProfile: mongoObjectIdSchema17.optional(),
    scheduledStartTime: z25.string().datetime({ message: "scheduledStartTime must be a valid ISO 8601 datetime" }),
    durationMinutes: z25.number().int().min(15).max(180).optional(),
    timezone: z25.string().trim().min(1).max(100),
    sessionTopic: z25.string().trim().min(2).max(500).optional(),
    notes: z25.string().trim().max(2e3).optional(),
    meetingUrl: z25.string().trim().url().optional()
  }).strict()
});
var updateMentorBookingValidation = z25.object({
  params: z25.object({
    id: mongoObjectIdSchema17
  }),
  body: z25.object({
    leadMentor: mongoObjectIdSchema17.optional(),
    leadMentorProfile: mongoObjectIdSchema17.optional(),
    coMentor: mongoObjectIdSchema17.nullable().optional(),
    coMentorProfile: mongoObjectIdSchema17.nullable().optional(),
    scheduledStartTime: z25.string().datetime({ message: "scheduledStartTime must be a valid ISO 8601 datetime" }).optional(),
    durationMinutes: z25.number().int().min(15).max(180).optional(),
    timezone: z25.string().trim().min(1).max(100).optional(),
    sessionTopic: z25.string().trim().min(2).max(500).optional(),
    notes: z25.string().trim().max(2e3).optional(),
    meetingUrl: z25.string().trim().url().nullable().optional()
  }).strict()
});
var confirmMentorBookingValidation = z25.object({
  params: z25.object({
    id: mongoObjectIdSchema17
  }),
  body: z25.object({
    meetingUrl: z25.string().trim().url().optional()
  }).strict()
});
var cancelMentorBookingValidation = z25.object({
  params: z25.object({
    id: mongoObjectIdSchema17
  }),
  body: z25.object({
    reason: z25.string().trim().min(3, "Cancellation reason must be at least 3 characters").max(1e3)
  }).strict()
});
var completeMentorBookingValidation = z25.object({
  params: z25.object({
    id: mongoObjectIdSchema17
  }),
  body: z25.object({
    mentorFeedback: z25.string().trim().max(3e3).optional()
  }).strict()
});
var noShowMentorBookingValidation = z25.object({
  params: z25.object({
    id: mongoObjectIdSchema17
  }),
  body: z25.object({
    noShowBy: z25.enum(NO_SHOW_PARTIES),
    reason: z25.string().trim().max(1e3).optional()
  }).strict()
});
var mentorBookingIdValidation = z25.object({
  params: z25.object({
    id: mongoObjectIdSchema17
  })
});
var queryMentorBookingValidation = z25.object({
  query: z25.object({
    memberId: mongoObjectIdSchema17.optional(),
    leadMentorId: mongoObjectIdSchema17.optional(),
    coMentorId: mongoObjectIdSchema17.optional(),
    mentorId: mongoObjectIdSchema17.optional(),
    status: z25.enum(MENTOR_BOOKING_STATUSES).optional(),
    startDate: z25.string().optional(),
    endDate: z25.string().optional(),
    page: z25.coerce.number().int().min(1).optional(),
    limit: z25.coerce.number().int().min(1).max(100).optional()
  }).optional()
});

// src/modules/mentorBookings/mentor.booking.service.ts
import { Types as Types36 } from "mongoose";

// src/modules/notifications/notification.service.ts
import { Types as Types35 } from "mongoose";

// src/socket/socket.ts
import { Server } from "socket.io";
import jwt4 from "jsonwebtoken";
var io;
var getUserRoom = (userId) => `user:${userId}`;
var emitNotificationToUser = (userId, payload) => {
  if (!io) {
    return;
  }
  io.to(getUserRoom(userId)).emit("notification:new", payload);
};
var onlineUsers = /* @__PURE__ */ new Map();
var getRoomOnlineUserIds = (roomId) => {
  const userIds = /* @__PURE__ */ new Set();
  const socketIds = io.sockets.adapter.rooms.get(roomId) ?? /* @__PURE__ */ new Set();
  for (const socketId of socketIds) {
    const roomSocket = io.sockets.sockets.get(socketId);
    const userId = roomSocket?.data.user?.id;
    if (userId) {
      userIds.add(userId);
    }
  }
  return Array.from(userIds);
};
var initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication token is required"));
    }
    try {
      const decoded = jwt4.verify(
        token,
        config_default.JWT_ACCESS_SECRET
      );
      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token payload"));
      }
      socket.data.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });
  io.on("connection", async (socket) => {
    try {
      const userId = socket.data.user.id;
      const userDoc = await User.findById(userId).select(
        "fullName profileImage country"
      );
      socket.data.user.fullName = userDoc?.fullName ?? "Unknown";
      socket.data.user.profileImage = userDoc?.profileImage ?? null;
      const countryName = userDoc?.country?.trim();
      if (!countryName) {
        socket.emit("error", "No country set on your profile");
        return socket.disconnect();
      }
      const country = resolveCountry(countryName);
      if (!country) {
        socket.emit("error", "Invalid country on your profile");
        return socket.disconnect();
      }
      const room = await getOrCreateCountryRoom(country.name, userId);
      let roomId = room._id.toString();
      socket.data.roomId = roomId;
      socket.join(roomId);
      socket.emit("room:joined", {
        roomId,
        countryCode: room.countryCode,
        countryName: room.countryName
      });
      socket.on("room:join", async (requestedCountryName) => {
        try {
          const canSwitchRooms = socket.data.user.role === "founder" || socket.data.user.role === "admin" || socket.data.user.role === "manager";
          if (!canSwitchRooms) {
            socket.emit(
              "error",
              "Only founders, admins, and managers can change community rooms"
            );
            return;
          }
          const requestedCountry = resolveCountry(requestedCountryName);
          if (!requestedCountry) {
            socket.emit("error", "Invalid country name");
            return;
          }
          const nextRoom = await getOrCreateCountryRoom(
            requestedCountry.name,
            userId
          );
          const nextRoomId = nextRoom._id.toString();
          if (roomId !== nextRoomId) {
            socket.leave(roomId);
            if (!getRoomOnlineUserIds(roomId).includes(userId)) {
              socket.to(roomId).emit("presence:update", { userId, online: false });
            }
            const wasOnlineInNextRoom = getRoomOnlineUserIds(nextRoomId).includes(
              userId
            );
            socket.join(nextRoomId);
            roomId = nextRoomId;
            socket.data.roomId = nextRoomId;
            if (!wasOnlineInNextRoom) {
              socket.to(nextRoomId).emit("presence:update", {
                userId,
                online: true
              });
            }
          }
          socket.emit("room:joined", {
            roomId: nextRoomId,
            countryCode: nextRoom.countryCode,
            countryName: nextRoom.countryName
          });
          socket.emit("presence:list", getRoomOnlineUserIds(nextRoomId));
        } catch (error) {
          console.error("room:join error:", error);
          socket.emit("error", error.message || "Failed to join room");
        }
      });
      const isFirstConnectionForUser = !onlineUsers.has(userId);
      if (isFirstConnectionForUser) {
        onlineUsers.set(userId, /* @__PURE__ */ new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      if (isFirstConnectionForUser) {
        socket.to(roomId).emit("presence:update", { userId, online: true });
      }
      socket.emit("presence:list", getRoomOnlineUserIds(roomId));
      socket.on(
        "message:send",
        async (payload) => {
          try {
            const content = payload?.content;
            if (!content || !content.trim()) return;
            const message = await createMessage(
              roomId,
              userId,
              content.trim(),
              payload?.replyTo ?? null
            );
            io.to(roomId).emit("message:new", message);
          } catch (error) {
            console.error("message:send error:", error);
            socket.emit("error", error.message || "Failed to send message");
          }
        }
      );
      socket.on("message:delete", async (messageId) => {
        try {
          if (!messageId) return;
          const deleted = await deleteMessage(messageId, userId);
          io.to(roomId).emit("message:deleted", {
            messageId: deleted._id.toString(),
            content: deleted.content
            // "This message was deleted"
          });
        } catch (error) {
          console.error("message:delete error:", error);
          socket.emit("error", error.message || "Failed to delete message");
        }
      });
      socket.on("typing:start", () => {
        socket.to(roomId).emit("typing:update", {
          userId,
          fullName: socket.data.user.fullName,
          typing: true
        });
      });
      socket.on("typing:stop", () => {
        socket.to(roomId).emit("typing:update", {
          userId,
          fullName: socket.data.user.fullName,
          typing: false
        });
      });
      socket.on("disconnect", () => {
        const userSockets = onlineUsers.get(userId);
        userSockets?.delete(socket.id);
        if (userSockets && userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
        if (!getRoomOnlineUserIds(roomId).includes(userId)) {
          socket.to(roomId).emit("presence:update", { userId, online: false });
        }
        console.log(`Socket disconnected: ${socket.id}`);
      });
    } catch (error) {
      console.error("Socket connection error:", error);
      socket.disconnect();
    }
  });
  return io;
};

// src/modules/notificationTemplates/notification.template.model.schema.ts
import { model as model35, Schema as Schema35 } from "mongoose";

// src/modules/notifications/notification.interface.ts
var NOTIFICATION_CHANNELS = ["in_app", "email", "push"];

// src/modules/notificationTemplates/notification.template.model.schema.ts
var notificationTemplateSchema = new Schema35(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      index: true
    },
    titleTemplate: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    bodyTemplate: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2e3
    },
    channels: {
      type: [String],
      enum: NOTIFICATION_CHANNELS,
      default: ["in_app"],
      required: true
    },
    actionUrlTemplate: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    enabled: {
      type: Boolean,
      default: true,
      required: true,
      index: true
    },
    createdBy: {
      type: Schema35.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema35.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    collection: "notificationtemplates"
  }
);
notificationTemplateSchema.index({
  enabled: 1,
  createdAt: -1
});
var NotificationTemplate = model35(
  "NotificationTemplate",
  notificationTemplateSchema
);

// src/modules/notifications/notification.model.schema.ts
import { model as model36, Schema as Schema36 } from "mongoose";
var notificationSchema = new Schema36(
  {
    recipient: {
      type: Schema36.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    actor: {
      type: Schema36.Types.ObjectId,
      ref: "User"
    },
    template: {
      type: Schema36.Types.ObjectId,
      ref: "NotificationTemplate"
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 120
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2e3
    },
    channels: {
      type: [String],
      enum: NOTIFICATION_CHANNELS,
      default: ["in_app"],
      required: true
    },
    relatedEntityType: {
      type: String,
      trim: true,
      maxlength: 120
    },
    relatedEntityId: {
      type: Schema36.Types.ObjectId
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    metadata: {
      type: Schema36.Types.Mixed
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    readAt: {
      type: Date
    },
    dedupeKey: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: "notifications"
  }
);
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1
});
notificationSchema.index({
  recipient: 1,
  createdAt: -1
});
notificationSchema.index({
  type: 1,
  createdAt: -1
});
notificationSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    sparse: true
  }
);
var Notification = model36(
  "Notification",
  notificationSchema
);

// src/modules/notifications/notification.service.ts
var NOTIFICATION_POPULATE = [
  {
    path: "recipient",
    select: "fullName email role profileImage accessTo"
  },
  {
    path: "actor",
    select: "fullName email role profileImage"
  },
  {
    path: "template",
    select: "key titleTemplate bodyTemplate channels enabled"
  }
];
var assertValidObjectId15 = (value, fieldName) => {
  if (!Types35.ObjectId.isValid(value)) {
    throwServiceError_default(`${fieldName} is invalid`, 400);
  }
};
var escapeRegex2 = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
var renderPlaceholders = (source, variables = {}) => {
  return source.replace(
    /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g,
    (_match, key) => {
      const value = variables[key];
      if (value === void 0 || value === null) {
        return "";
      }
      return String(value);
    }
  );
};
var getExistingByDedupeKey = async (dedupeKey) => {
  if (!dedupeKey) {
    return null;
  }
  return Notification.findOne({ dedupeKey }).populate(NOTIFICATION_POPULATE);
};
var createNotificationRecord = async (payload, templateId) => {
  assertValidObjectId15(payload.recipient, "Recipient user ID");
  if (payload.actor) {
    assertValidObjectId15(payload.actor, "Actor user ID");
  }
  if (payload.relatedEntityId) {
    assertValidObjectId15(payload.relatedEntityId, "Related entity ID");
  }
  const existing = await getExistingByDedupeKey(payload.dedupeKey);
  if (existing) {
    return existing;
  }
  const recipient = await User.findById(payload.recipient).select("_id");
  assertFound_default(recipient, "Notification recipient user not found", 404);
  const createData = {
    recipient: new Types35.ObjectId(payload.recipient),
    type: payload.type.trim(),
    title: payload.title.trim(),
    body: payload.body.trim(),
    channels: payload.channels ?? ["in_app"],
    isRead: false
  };
  if (payload.actor) {
    createData.actor = new Types35.ObjectId(payload.actor);
  }
  if (templateId) {
    createData.template = templateId;
  }
  if (payload.relatedEntityType) {
    createData.relatedEntityType = payload.relatedEntityType;
  }
  if (payload.relatedEntityId) {
    createData.relatedEntityId = new Types35.ObjectId(payload.relatedEntityId);
  }
  if (payload.actionUrl) {
    createData.actionUrl = payload.actionUrl;
  }
  if (payload.metadata !== void 0) {
    createData.metadata = payload.metadata;
  }
  if (payload.dedupeKey) {
    createData.dedupeKey = payload.dedupeKey;
  }
  try {
    const notification = await Notification.create(createData);
    await notification.populate(NOTIFICATION_POPULATE);
    if (notification.channels.includes("in_app")) {
      emitNotificationToUser(
        payload.recipient,
        notification.toObject()
      );
    }
    return notification;
  } catch (error) {
    const maybeMongoError = error;
    if (maybeMongoError.code === 11e3 && payload.dedupeKey) {
      const duplicate = await getExistingByDedupeKey(payload.dedupeKey);
      if (duplicate) {
        return duplicate;
      }
    }
    throw error;
  }
};
var createNotification = async (payload) => {
  return createNotificationRecord(payload);
};
var createNotificationFromTemplate = async (payload) => {
  const template = await NotificationTemplate.findOne({
    key: payload.templateKey.trim().toLowerCase()
  });
  assertFound_default(
    template,
    `Notification template "${payload.templateKey}" not found`,
    404
  );
  if (!template.enabled) {
    throwServiceError_default(
      `Notification template "${template.key}" is disabled`,
      400
    );
  }
  const variables = payload.variables ?? {};
  const actionUrl = payload.actionUrl ?? (template.actionUrlTemplate ? renderPlaceholders(template.actionUrlTemplate, variables) : void 0);
  const notificationPayload = {
    recipient: payload.recipient,
    type: template.key,
    title: renderPlaceholders(template.titleTemplate, variables),
    body: renderPlaceholders(template.bodyTemplate, variables),
    channels: payload.channels ?? template.channels,
    ...payload.actor ? { actor: payload.actor } : {},
    ...payload.relatedEntityType ? { relatedEntityType: payload.relatedEntityType } : {},
    ...payload.relatedEntityId ? { relatedEntityId: payload.relatedEntityId } : {},
    ...actionUrl ? { actionUrl } : {},
    ...payload.metadata !== void 0 ? { metadata: payload.metadata } : {},
    ...payload.dedupeKey ? { dedupeKey: payload.dedupeKey } : {}
  };
  return createNotificationRecord(
    notificationPayload,
    template._id
  );
};
var safeCreateNotification = async (payload) => {
  try {
    return await createNotification(payload);
  } catch (error) {
    console.error("Notification create failed:", error);
    return null;
  }
};
var safeCreateFromTemplateOrFallback = async (payload) => {
  try {
    const template = await NotificationTemplate.findOne({
      key: payload.templateKey.trim().toLowerCase()
    });
    if (template && !template.enabled) {
      return null;
    }
    if (template) {
      const fromTemplatePayload = {
        recipient: payload.recipient,
        templateKey: template.key,
        variables: payload.variables ?? {},
        ...payload.actor ? { actor: payload.actor } : {},
        ...payload.channels ? { channels: payload.channels } : {},
        ...payload.relatedEntityType ? { relatedEntityType: payload.relatedEntityType } : {},
        ...payload.relatedEntityId ? { relatedEntityId: payload.relatedEntityId } : {},
        ...payload.actionUrl ? { actionUrl: payload.actionUrl } : {},
        ...payload.metadata !== void 0 ? { metadata: payload.metadata } : {},
        ...payload.dedupeKey ? { dedupeKey: payload.dedupeKey } : {}
      };
      return await createNotificationFromTemplate(fromTemplatePayload);
    }
    const fallbackPayload = {
      recipient: payload.recipient,
      type: payload.templateKey.trim().toLowerCase(),
      title: payload.fallbackTitle,
      body: payload.fallbackBody,
      channels: payload.channels ?? ["in_app"],
      ...payload.actor ? { actor: payload.actor } : {},
      ...payload.relatedEntityType ? { relatedEntityType: payload.relatedEntityType } : {},
      ...payload.relatedEntityId ? { relatedEntityId: payload.relatedEntityId } : {},
      ...payload.actionUrl ? { actionUrl: payload.actionUrl } : {},
      ...payload.metadata !== void 0 ? { metadata: payload.metadata } : {},
      ...payload.dedupeKey ? { dedupeKey: payload.dedupeKey } : {}
    };
    return await createNotification(fallbackPayload);
  } catch (error) {
    console.error(
      `Notification dispatch failed for "${payload.templateKey}":`,
      error
    );
    return null;
  }
};
var buildNotificationFilter = (query, recipientId) => {
  const filter = {};
  if (recipientId) {
    assertValidObjectId15(recipientId, "Recipient user ID");
    filter.recipient = new Types35.ObjectId(recipientId);
  }
  if (query.isRead !== void 0) {
    filter.isRead = query.isRead;
  }
  if (query.type) {
    filter.type = query.type;
  }
  if (query.search) {
    const regex = new RegExp(escapeRegex2(query.search), "i");
    filter.$or = [
      { title: regex },
      { body: regex },
      { type: regex }
    ];
  }
  return filter;
};
var getMyNotifications = async (userId, query = {}) => {
  const filter = buildNotificationFilter(query, userId);
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(NOTIFICATION_POPULATE),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      recipient: new Types35.ObjectId(userId),
      isRead: false
    })
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount
    },
    data
  };
};
var getUnreadCount = async (userId) => {
  assertValidObjectId15(userId, "User ID");
  const unreadCount = await Notification.countDocuments({
    recipient: new Types35.ObjectId(userId),
    isRead: false
  });
  return {
    unreadCount
  };
};
var markOneAsRead = async (notificationId, userId) => {
  assertValidObjectId15(notificationId, "Notification ID");
  assertValidObjectId15(userId, "User ID");
  const notification = await Notification.findOneAndUpdate(
    {
      _id: new Types35.ObjectId(notificationId),
      recipient: new Types35.ObjectId(userId)
    },
    {
      $set: {
        isRead: true,
        readAt: /* @__PURE__ */ new Date()
      }
    },
    {
      new: true
    }
  ).populate(NOTIFICATION_POPULATE);
  assertFound_default(notification, "Notification not found", 404);
  return notification;
};
var markOneAsUnread = async (notificationId, userId) => {
  assertValidObjectId15(notificationId, "Notification ID");
  assertValidObjectId15(userId, "User ID");
  const notification = await Notification.findOneAndUpdate(
    {
      _id: new Types35.ObjectId(notificationId),
      recipient: new Types35.ObjectId(userId)
    },
    {
      $set: {
        isRead: false
      },
      $unset: {
        readAt: 1
      }
    },
    {
      new: true
    }
  ).populate(NOTIFICATION_POPULATE);
  assertFound_default(notification, "Notification not found", 404);
  return notification;
};
var markAllAsRead = async (userId) => {
  assertValidObjectId15(userId, "User ID");
  const now = /* @__PURE__ */ new Date();
  const result = await Notification.updateMany(
    {
      recipient: new Types35.ObjectId(userId),
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: now
      }
    }
  );
  return {
    modifiedCount: result.modifiedCount,
    readAt: now
  };
};
var getAllNotificationsAdmin = async (query = {}) => {
  const filter = buildNotificationFilter(query, query.recipientId);
  if (query.actorId) {
    assertValidObjectId15(query.actorId, "Actor user ID");
    filter.actor = new Types35.ObjectId(query.actorId);
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(NOTIFICATION_POPULATE),
    Notification.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data
  };
};
var notificationService = {
  createNotification,
  createNotificationFromTemplate,
  safeCreateNotification,
  safeCreateFromTemplateOrFallback,
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  markOneAsUnread,
  markAllAsRead,
  getAllNotificationsAdmin
};

// src/modules/mentorBookings/mentor.booking.model.schema.ts
import { model as model37, Schema as Schema37 } from "mongoose";
var mentorBookingSchema = new Schema37(
  {
    member: {
      type: Schema37.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    leadMentor: {
      type: Schema37.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    leadMentorProfile: {
      type: Schema37.Types.ObjectId,
      ref: "MentorshipProfile",
      index: true
    },
    coMentor: {
      type: Schema37.Types.ObjectId,
      ref: "User",
      index: true
    },
    coMentorProfile: {
      type: Schema37.Types.ObjectId,
      ref: "MentorshipProfile",
      index: true
    },
    scheduledStartTime: {
      type: Date,
      required: true,
      index: true
    },
    scheduledEndTime: {
      type: Date,
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 180,
      required: true
    },
    timezone: {
      type: String,
      required: true,
      trim: true
    },
    meetingUrl: {
      type: String,
      trim: true
    },
    sessionTopic: {
      type: String,
      trim: true,
      maxlength: 500
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2e3
    },
    status: {
      type: String,
      enum: MENTOR_BOOKING_STATUSES,
      default: "requested",
      index: true,
      required: true
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    cancelledBy: {
      type: Schema37.Types.ObjectId,
      ref: "User"
    },
    cancelledAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    noShowAt: {
      type: Date
    },
    noShowBy: {
      type: String,
      enum: NO_SHOW_PARTIES
    },
    noShowReason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    mentorFeedback: {
      type: String,
      trim: true,
      maxlength: 3e3
    },
    createdBy: {
      type: Schema37.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema37.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "mentorbookings"
  }
);
mentorBookingSchema.index({
  member: 1,
  status: 1
});
mentorBookingSchema.index({
  leadMentor: 1,
  status: 1
});
mentorBookingSchema.index({
  coMentor: 1,
  status: 1
});
mentorBookingSchema.index({
  scheduledStartTime: 1,
  scheduledEndTime: 1
});
mentorBookingSchema.index({
  status: 1,
  scheduledStartTime: 1
});
var MentorBooking = model37(
  "MentorBooking",
  mentorBookingSchema
);

// src/modules/mentorBookings/mentor.booking.service.ts
var throwServiceError19 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound19 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError19(message, statusCode);
  }
};
var assertValidObjectId16 = (value, fieldName) => {
  if (!Types36.ObjectId.isValid(value)) {
    throwServiceError19(`${fieldName} is invalid`, 400);
  }
};
var isAdminOrManager13 = (role) => {
  return role === "admin" || role === "manager" || role === "founder" || role === "super_admin";
};
var BOOKING_POPULATE = [
  {
    path: "member",
    select: "fullName email role profileImage phone city country"
  },
  {
    path: "leadMentor",
    select: "fullName email role profileImage"
  },
  {
    path: "leadMentorProfile",
    select: "bio expertise profileImage sessionDurationMinutes isPrimaryMentor status"
  },
  {
    path: "coMentor",
    select: "fullName email role profileImage"
  },
  {
    path: "coMentorProfile",
    select: "bio expertise profileImage sessionDurationMinutes isPrimaryMentor status"
  },
  {
    path: "cancelledBy",
    select: "fullName email role"
  },
  {
    path: "createdBy",
    select: "fullName email role"
  },
  {
    path: "updatedBy",
    select: "fullName email role"
  }
];
var checkUserExists = async (userId, label) => {
  assertValidObjectId16(userId, label);
  const user = await User.findById(userId).select("_id fullName email role");
  assertFound19(user, `${label} not found`, 404);
  return user;
};
var resolveMentorshipProfileId = async (mentorUserId, explicitProfileId) => {
  if (explicitProfileId) {
    assertValidObjectId16(explicitProfileId, "Mentorship profile ID");
    const profile2 = await MentorshipProfile.findById(explicitProfileId);
    assertFound19(profile2, "Mentorship profile not found", 404);
    if (String(profile2.mentor) !== mentorUserId) {
      throwServiceError19(
        "Provided mentorship profile does not belong to the selected mentor",
        400
      );
    }
    return profile2._id;
  }
  const profile = await MentorshipProfile.findOne({
    mentor: new Types36.ObjectId(mentorUserId),
    isActive: true
  });
  return profile ? profile._id : void 0;
};
var checkSchedulingConflicts = async ({
  memberId,
  leadMentorId,
  coMentorId,
  startTime,
  endTime,
  excludeBookingId
}) => {
  const activeStatuses = ["requested", "confirmed"];
  const baseOverlapFilter = {
    status: { $in: activeStatuses },
    scheduledStartTime: { $lt: endTime },
    scheduledEndTime: { $gt: startTime }
  };
  if (excludeBookingId) {
    baseOverlapFilter._id = { $ne: new Types36.ObjectId(excludeBookingId) };
  }
  const memberConflict = await MentorBooking.findOne({
    ...baseOverlapFilter,
    member: new Types36.ObjectId(memberId)
  });
  if (memberConflict) {
    throwServiceError19(
      "You already have a pending or confirmed booking in this time slot",
      409
    );
  }
  const leadMentorConflict = await MentorBooking.findOne({
    ...baseOverlapFilter,
    $or: [
      { leadMentor: new Types36.ObjectId(leadMentorId) },
      { coMentor: new Types36.ObjectId(leadMentorId) },
      { member: new Types36.ObjectId(leadMentorId) }
    ]
  });
  if (leadMentorConflict) {
    throwServiceError19(
      "The lead mentor already has a scheduled session during this time slot",
      409
    );
  }
  if (coMentorId) {
    const coMentorConflict = await MentorBooking.findOne({
      ...baseOverlapFilter,
      $or: [
        { leadMentor: new Types36.ObjectId(coMentorId) },
        { coMentor: new Types36.ObjectId(coMentorId) },
        { member: new Types36.ObjectId(coMentorId) }
      ]
    });
    if (coMentorConflict) {
      throwServiceError19(
        "The co-mentor already has a scheduled session during this time slot",
        409
      );
    }
  }
};
var createBooking = async (payload, memberUserId, actorId) => {
  assertValidObjectId16(payload.leadMentor, "Lead mentor ID");
  assertValidObjectId16(memberUserId, "Member user ID");
  const memberUser = await checkUserExists(memberUserId, "Member user");
  if (memberUserId === payload.leadMentor) {
    throwServiceError19("A member cannot book a mentorship session with themselves", 400);
  }
  if (payload.coMentor) {
    assertValidObjectId16(payload.coMentor, "Co-mentor ID");
    if (memberUserId === payload.coMentor) {
      throwServiceError19("A member cannot add themselves as co-mentor", 400);
    }
    if (payload.leadMentor === payload.coMentor) {
      throwServiceError19("Lead mentor and co-mentor cannot be the same user", 400);
    }
    await checkUserExists(payload.coMentor, "Co-mentor user");
  }
  await checkUserExists(payload.leadMentor, "Lead mentor user");
  const startTime = new Date(payload.scheduledStartTime);
  if (Number.isNaN(startTime.getTime())) {
    throwServiceError19("Invalid scheduledStartTime format", 400);
  }
  const durationMinutes = payload.durationMinutes ?? 60;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1e3);
  await checkSchedulingConflicts({
    memberId: memberUserId,
    leadMentorId: payload.leadMentor,
    coMentorId: payload.coMentor,
    startTime,
    endTime
  });
  const leadMentorProfileId = await resolveMentorshipProfileId(
    payload.leadMentor,
    payload.leadMentorProfile
  );
  let coMentorProfileId;
  if (payload.coMentor) {
    coMentorProfileId = await resolveMentorshipProfileId(
      payload.coMentor,
      payload.coMentorProfile
    );
  }
  const createData = {
    member: new Types36.ObjectId(memberUserId),
    leadMentor: new Types36.ObjectId(payload.leadMentor),
    scheduledStartTime: startTime,
    scheduledEndTime: endTime,
    durationMinutes,
    timezone: payload.timezone,
    status: "requested",
    createdBy: new Types36.ObjectId(actorId)
  };
  if (leadMentorProfileId) {
    createData.leadMentorProfile = leadMentorProfileId;
  }
  if (payload.coMentor) {
    createData.coMentor = new Types36.ObjectId(payload.coMentor);
  }
  if (coMentorProfileId) {
    createData.coMentorProfile = coMentorProfileId;
  }
  if (payload.sessionTopic !== void 0) {
    createData.sessionTopic = payload.sessionTopic;
  }
  if (payload.notes !== void 0) {
    createData.notes = payload.notes;
  }
  if (payload.meetingUrl !== void 0) {
    createData.meetingUrl = payload.meetingUrl;
  }
  const booking = await MentorBooking.create(createData);
  const bookingId = String(booking._id);
  const mentorRecipients = [
    String(booking.leadMentor),
    ...booking.coMentor ? [String(booking.coMentor)] : []
  ];
  await Promise.all(
    mentorRecipients.map(
      (recipientId) => notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_requested",
        fallbackTitle: "New mentorship booking request",
        fallbackBody: `${memberUser.fullName} requested a mentorship session.`,
        recipient: recipientId,
        actor: memberUserId,
        variables: {
          memberName: memberUser.fullName,
          bookingId,
          scheduledStartTime: booking.scheduledStartTime.toISOString()
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: bookingId,
        metadata: {
          status: booking.status,
          timezone: booking.timezone
        },
        dedupeKey: `mentor_booking_requested:${bookingId}:${recipientId}`
      })
    )
  );
  return booking.populate(BOOKING_POPULATE);
};
var getMyMemberBookings = async (memberUserId, query = {}) => {
  assertValidObjectId16(memberUserId, "Member user ID");
  const filter = {
    member: new Types36.ObjectId(memberUserId)
  };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.startDate || query.endDate) {
    const timeFilter = {};
    if (query.startDate) {
      timeFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      timeFilter.$lte = new Date(query.endDate);
    }
    filter.scheduledStartTime = timeFilter;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    MentorBooking.find(filter).sort({ scheduledStartTime: -1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE),
    MentorBooking.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: bookings
  };
};
var getMyMemberSingleBooking = async (bookingId, memberUserId) => {
  assertValidObjectId16(bookingId, "Booking ID");
  assertValidObjectId16(memberUserId, "Member user ID");
  const booking = await MentorBooking.findOne({
    _id: new Types36.ObjectId(bookingId),
    member: new Types36.ObjectId(memberUserId)
  }).populate(BOOKING_POPULATE);
  assertFound19(booking, "Mentor booking not found", 404);
  return booking;
};
var getMyMentorBookings = async (mentorUserId, query = {}) => {
  assertValidObjectId16(mentorUserId, "Mentor user ID");
  const mentorObjectId = new Types36.ObjectId(mentorUserId);
  const filter = {
    $or: [{ leadMentor: mentorObjectId }, { coMentor: mentorObjectId }]
  };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.startDate || query.endDate) {
    const timeFilter = {};
    if (query.startDate) {
      timeFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      timeFilter.$lte = new Date(query.endDate);
    }
    filter.scheduledStartTime = timeFilter;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    MentorBooking.find(filter).sort({ scheduledStartTime: 1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE),
    MentorBooking.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: bookings
  };
};
var getMyMentorSingleBooking = async (bookingId, mentorUserId) => {
  assertValidObjectId16(bookingId, "Booking ID");
  assertValidObjectId16(mentorUserId, "Mentor user ID");
  const mentorObjectId = new Types36.ObjectId(mentorUserId);
  const booking = await MentorBooking.findOne({
    _id: new Types36.ObjectId(bookingId),
    $or: [{ leadMentor: mentorObjectId }, { coMentor: mentorObjectId }]
  }).populate(BOOKING_POPULATE);
  assertFound19(booking, "Mentor booking not found", 404);
  return booking;
};
var getAllBookingsAdmin = async (query = {}) => {
  const filter = {};
  if (query.memberId) {
    assertValidObjectId16(query.memberId, "Member ID");
    filter.member = new Types36.ObjectId(query.memberId);
  }
  if (query.leadMentorId) {
    assertValidObjectId16(query.leadMentorId, "Lead mentor ID");
    filter.leadMentor = new Types36.ObjectId(query.leadMentorId);
  }
  if (query.coMentorId) {
    assertValidObjectId16(query.coMentorId, "Co-mentor ID");
    filter.coMentor = new Types36.ObjectId(query.coMentorId);
  }
  if (query.mentorId) {
    assertValidObjectId16(query.mentorId, "Mentor ID");
    const mentorObjId = new Types36.ObjectId(query.mentorId);
    filter.$or = [{ leadMentor: mentorObjId }, { coMentor: mentorObjId }];
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.startDate || query.endDate) {
    const timeFilter = {};
    if (query.startDate) {
      timeFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      timeFilter.$lte = new Date(query.endDate);
    }
    filter.scheduledStartTime = timeFilter;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    MentorBooking.find(filter).sort({ scheduledStartTime: -1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE),
    MentorBooking.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: bookings
  };
};
var getSingleBookingAdmin = async (bookingId) => {
  assertValidObjectId16(bookingId, "Booking ID");
  const booking = await MentorBooking.findById(bookingId).populate(
    BOOKING_POPULATE
  );
  assertFound19(booking, "Mentor booking not found", 404);
  return booking;
};
var updateBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole
}) => {
  assertValidObjectId16(bookingId, "Booking ID");
  const booking = await MentorBooking.findById(bookingId);
  assertFound19(booking, "Mentor booking not found", 404);
  const isMember = String(booking.member) === actorId;
  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager13(actorRole);
  if (!isMember && !isLead && !isCo && !isAdmin) {
    throwServiceError19("You are not authorized to update this booking", 403);
  }
  if (booking.status === "completed" || booking.status === "cancelled" || booking.status === "no_show") {
    throwServiceError19(
      `Cannot update a booking that is already ${booking.status}`,
      400
    );
  }
  const newLeadMentorId = payload.leadMentor ?? String(booking.leadMentor);
  let newCoMentorId = booking.coMentor ? String(booking.coMentor) : void 0;
  if (payload.coMentor === null) {
    newCoMentorId = void 0;
  } else if (payload.coMentor !== void 0) {
    newCoMentorId = payload.coMentor;
  }
  if (String(booking.member) === newLeadMentorId) {
    throwServiceError19("A member cannot book a mentorship session with themselves", 400);
  }
  if (newCoMentorId && String(booking.member) === newCoMentorId) {
    throwServiceError19("A member cannot add themselves as co-mentor", 400);
  }
  if (newCoMentorId && newLeadMentorId === newCoMentorId) {
    throwServiceError19("Lead mentor and co-mentor cannot be the same user", 400);
  }
  if (payload.leadMentor && payload.leadMentor !== String(booking.leadMentor)) {
    await checkUserExists(payload.leadMentor, "Lead mentor user");
    booking.leadMentor = new Types36.ObjectId(payload.leadMentor);
  }
  if (payload.coMentor !== void 0) {
    if (payload.coMentor === null) {
      booking.set("coMentor", void 0);
      booking.set("coMentorProfile", void 0);
    } else {
      await checkUserExists(payload.coMentor, "Co-mentor user");
      booking.coMentor = new Types36.ObjectId(payload.coMentor);
    }
  }
  if (payload.leadMentorProfile !== void 0) {
    const profileId = await resolveMentorshipProfileId(
      newLeadMentorId,
      payload.leadMentorProfile
    );
    if (profileId) {
      booking.leadMentorProfile = profileId;
    } else {
      booking.set("leadMentorProfile", void 0);
    }
  }
  if (payload.coMentorProfile !== void 0 && newCoMentorId) {
    const profileId = await resolveMentorshipProfileId(
      newCoMentorId,
      payload.coMentorProfile ?? void 0
    );
    if (profileId) {
      booking.coMentorProfile = profileId;
    } else {
      booking.set("coMentorProfile", void 0);
    }
  }
  const durationMinutes = payload.durationMinutes ?? booking.durationMinutes;
  let startTime = booking.scheduledStartTime;
  if (payload.scheduledStartTime) {
    startTime = new Date(payload.scheduledStartTime);
    if (Number.isNaN(startTime.getTime())) {
      throwServiceError19("Invalid scheduledStartTime format", 400);
    }
  }
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1e3);
  await checkSchedulingConflicts({
    memberId: String(booking.member),
    leadMentorId: newLeadMentorId,
    coMentorId: newCoMentorId,
    startTime,
    endTime,
    excludeBookingId: String(booking._id)
  });
  booking.scheduledStartTime = startTime;
  booking.scheduledEndTime = endTime;
  booking.durationMinutes = durationMinutes;
  if (payload.timezone !== void 0) {
    booking.timezone = payload.timezone;
  }
  if (payload.sessionTopic !== void 0) {
    booking.sessionTopic = payload.sessionTopic;
  }
  if (payload.notes !== void 0) {
    booking.notes = payload.notes;
  }
  if (payload.meetingUrl === null) {
    booking.set("meetingUrl", void 0);
  } else if (payload.meetingUrl !== void 0) {
    booking.meetingUrl = payload.meetingUrl;
  }
  booking.updatedBy = new Types36.ObjectId(actorId);
  await booking.save();
  const updatedBookingId = String(booking._id);
  const updateRecipients = [
    String(booking.member),
    String(booking.leadMentor),
    ...booking.coMentor ? [String(booking.coMentor)] : []
  ].filter(
    (recipientId, index, all) => recipientId !== actorId && all.indexOf(recipientId) === index
  );
  await Promise.all(
    updateRecipients.map(
      (recipientId) => notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_updated",
        fallbackTitle: "Mentorship booking updated",
        fallbackBody: "A mentorship booking you are part of has been updated.",
        recipient: recipientId,
        actor: actorId,
        variables: {
          bookingId: updatedBookingId,
          scheduledStartTime: booking.scheduledStartTime.toISOString()
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: updatedBookingId,
        metadata: {
          status: booking.status,
          timezone: booking.timezone
        },
        dedupeKey: `mentor_booking_updated:${updatedBookingId}:${booking.updatedAt?.getTime() ?? Date.now()}:${recipientId}`
      })
    )
  );
  return booking.populate(BOOKING_POPULATE);
};
var confirmBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole
}) => {
  assertValidObjectId16(bookingId, "Booking ID");
  const booking = await MentorBooking.findById(bookingId);
  assertFound19(booking, "Mentor booking not found", 404);
  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager13(actorRole);
  if (!isLead && !isCo && !isAdmin) {
    throwServiceError19("Only assigned mentors or administrators can confirm bookings", 403);
  }
  if (booking.status === "confirmed") {
    if (payload.meetingUrl) {
      booking.meetingUrl = payload.meetingUrl;
      booking.updatedBy = new Types36.ObjectId(actorId);
      await booking.save();
      return booking.populate(BOOKING_POPULATE);
    }
    return booking.populate(BOOKING_POPULATE);
  }
  if (booking.status !== "requested") {
    throwServiceError19(`Cannot confirm a booking with status "${booking.status}"`, 400);
  }
  await checkSchedulingConflicts({
    memberId: String(booking.member),
    leadMentorId: String(booking.leadMentor),
    coMentorId: booking.coMentor ? String(booking.coMentor) : void 0,
    startTime: booking.scheduledStartTime,
    endTime: booking.scheduledEndTime,
    excludeBookingId: String(booking._id)
  });
  booking.status = "confirmed";
  if (payload.meetingUrl !== void 0) {
    booking.meetingUrl = payload.meetingUrl;
  }
  booking.updatedBy = new Types36.ObjectId(actorId);
  await booking.save();
  const confirmedBookingId = String(booking._id);
  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "mentor_booking_confirmed",
    fallbackTitle: "Mentorship booking confirmed",
    fallbackBody: "Your mentorship session has been confirmed.",
    recipient: String(booking.member),
    actor: actorId,
    variables: {
      bookingId: confirmedBookingId,
      scheduledStartTime: booking.scheduledStartTime.toISOString(),
      meetingUrl: booking.meetingUrl ?? ""
    },
    relatedEntityType: "MentorBooking",
    relatedEntityId: confirmedBookingId,
    metadata: {
      status: booking.status,
      meetingUrl: booking.meetingUrl ?? null
    },
    dedupeKey: `mentor_booking_confirmed:${confirmedBookingId}`
  });
  return booking.populate(BOOKING_POPULATE);
};
var cancelBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole
}) => {
  assertValidObjectId16(bookingId, "Booking ID");
  const booking = await MentorBooking.findById(bookingId);
  assertFound19(booking, "Mentor booking not found", 404);
  const isMember = String(booking.member) === actorId;
  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager13(actorRole);
  if (!isMember && !isLead && !isCo && !isAdmin) {
    throwServiceError19("You are not authorized to cancel this booking", 403);
  }
  if (booking.status === "cancelled") {
    throwServiceError19("Booking is already cancelled", 400);
  }
  if (booking.status === "completed") {
    throwServiceError19("Completed booking cannot be cancelled", 400);
  }
  booking.status = "cancelled";
  booking.cancellationReason = payload.reason;
  booking.cancelledBy = new Types36.ObjectId(actorId);
  booking.cancelledAt = /* @__PURE__ */ new Date();
  booking.updatedBy = new Types36.ObjectId(actorId);
  await booking.save();
  const cancelledBookingId = String(booking._id);
  const cancellationRecipients = [
    String(booking.member),
    String(booking.leadMentor),
    ...booking.coMentor ? [String(booking.coMentor)] : []
  ].filter(
    (recipientId, index, all) => recipientId !== actorId && all.indexOf(recipientId) === index
  );
  await Promise.all(
    cancellationRecipients.map(
      (recipientId) => notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_cancelled",
        fallbackTitle: "Mentorship booking cancelled",
        fallbackBody: `A mentorship booking has been cancelled. Reason: ${payload.reason}`,
        recipient: recipientId,
        actor: actorId,
        variables: {
          bookingId: cancelledBookingId,
          reason: payload.reason
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: cancelledBookingId,
        metadata: {
          status: booking.status,
          reason: payload.reason
        },
        dedupeKey: `mentor_booking_cancelled:${cancelledBookingId}:${recipientId}`
      })
    )
  );
  return booking.populate(BOOKING_POPULATE);
};
var completeBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole
}) => {
  assertValidObjectId16(bookingId, "Booking ID");
  const booking = await MentorBooking.findById(bookingId);
  assertFound19(booking, "Mentor booking not found", 404);
  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager13(actorRole);
  if (!isLead && !isCo && !isAdmin) {
    throwServiceError19("Only assigned mentors or administrators can complete bookings", 403);
  }
  if (booking.status === "cancelled") {
    throwServiceError19("Cancelled booking cannot be marked as completed", 400);
  }
  if (booking.status === "no_show") {
    throwServiceError19("No-show booking cannot be marked as completed", 400);
  }
  booking.status = "completed";
  booking.completedAt = /* @__PURE__ */ new Date();
  if (payload.mentorFeedback !== void 0) {
    booking.mentorFeedback = payload.mentorFeedback;
  }
  booking.updatedBy = new Types36.ObjectId(actorId);
  await booking.save();
  const completedBookingId = String(booking._id);
  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "mentor_booking_completed",
    fallbackTitle: "Mentorship session completed",
    fallbackBody: "Your mentorship session has been marked as completed.",
    recipient: String(booking.member),
    actor: actorId,
    variables: {
      bookingId: completedBookingId
    },
    relatedEntityType: "MentorBooking",
    relatedEntityId: completedBookingId,
    metadata: {
      status: booking.status
    },
    dedupeKey: `mentor_booking_completed:${completedBookingId}`
  });
  return booking.populate(BOOKING_POPULATE);
};
var markNoShowBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole
}) => {
  assertValidObjectId16(bookingId, "Booking ID");
  const booking = await MentorBooking.findById(bookingId);
  assertFound19(booking, "Mentor booking not found", 404);
  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager13(actorRole);
  if (!isLead && !isCo && !isAdmin) {
    throwServiceError19("Only assigned mentors or administrators can record no-shows", 403);
  }
  if (booking.status === "cancelled") {
    throwServiceError19("Cancelled booking cannot be marked as no-show", 400);
  }
  if (booking.status === "completed") {
    throwServiceError19("Completed booking cannot be marked as no-show", 400);
  }
  booking.status = "no_show";
  booking.noShowAt = /* @__PURE__ */ new Date();
  booking.noShowBy = payload.noShowBy;
  if (payload.reason !== void 0) {
    booking.noShowReason = payload.reason;
  }
  booking.updatedBy = new Types36.ObjectId(actorId);
  await booking.save();
  const noShowBookingId = String(booking._id);
  const noShowRecipients = [
    String(booking.member),
    String(booking.leadMentor),
    ...booking.coMentor ? [String(booking.coMentor)] : []
  ].filter(
    (recipientId, index, all) => recipientId !== actorId && all.indexOf(recipientId) === index
  );
  await Promise.all(
    noShowRecipients.map(
      (recipientId) => notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_no_show",
        fallbackTitle: "Mentorship no-show recorded",
        fallbackBody: "A no-show has been recorded for a mentorship booking.",
        recipient: recipientId,
        actor: actorId,
        variables: {
          bookingId: noShowBookingId,
          noShowBy: payload.noShowBy,
          reason: payload.reason ?? ""
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: noShowBookingId,
        metadata: {
          status: booking.status,
          noShowBy: payload.noShowBy,
          reason: payload.reason ?? null
        },
        dedupeKey: `mentor_booking_no_show:${noShowBookingId}:${recipientId}`
      })
    )
  );
  return booking.populate(BOOKING_POPULATE);
};
var mentorBookingService = {
  createBooking,
  getMyMemberBookings,
  getMyMemberSingleBooking,
  getMyMentorBookings,
  getMyMentorSingleBooking,
  getAllBookingsAdmin,
  getSingleBookingAdmin,
  updateBooking,
  confirmBooking,
  cancelBooking,
  completeBooking,
  markNoShowBooking
};

// src/modules/mentorBookings/mentor.booking.controller.ts
var getAuthUser20 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.createBooking(
      req.body,
      authUser.id,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Mentor booking requested successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var getMyMemberBookings2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const result = await mentorBookingService.getMyMemberBookings(
      authUser.id,
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Member bookings retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyMemberSingleBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.getMyMemberSingleBooking(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Member booking retrieved successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var getMyMentorBookings2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const result = await mentorBookingService.getMyMentorBookings(
      authUser.id,
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor schedule retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyMentorSingleBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.getMyMentorSingleBooking(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking retrieved successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var getAllBookingsAdmin2 = async (req, res, next) => {
  try {
    const result = await mentorBookingService.getAllBookingsAdmin(
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All mentor bookings retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleBookingAdmin2 = async (req, res, next) => {
  try {
    const booking = await mentorBookingService.getSingleBookingAdmin(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking retrieved successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var updateBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.updateBooking({
      bookingId: String(req.params.id),
      payload: req.body,
      actorId: authUser.id,
      actorRole: authUser.role
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking updated successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var confirmBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.confirmBooking({
      bookingId: String(req.params.id),
      payload: req.body,
      actorId: authUser.id,
      actorRole: authUser.role
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking confirmed successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var cancelBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.cancelBooking({
      bookingId: String(req.params.id),
      payload: req.body,
      actorId: authUser.id,
      actorRole: authUser.role
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking cancelled successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var completeBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.completeBooking({
      bookingId: String(req.params.id),
      payload: req.body,
      actorId: authUser.id,
      actorRole: authUser.role
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking marked as completed successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var markNoShowBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser20(req);
    const booking = await mentorBookingService.markNoShowBooking({
      bookingId: String(req.params.id),
      payload: req.body,
      actorId: authUser.id,
      actorRole: authUser.role
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking marked as no-show successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var mentorBookingController = {
  createBooking: createBooking2,
  getMyMemberBookings: getMyMemberBookings2,
  getMyMemberSingleBooking: getMyMemberSingleBooking2,
  getMyMentorBookings: getMyMentorBookings2,
  getMyMentorSingleBooking: getMyMentorSingleBooking2,
  getAllBookingsAdmin: getAllBookingsAdmin2,
  getSingleBookingAdmin: getSingleBookingAdmin2,
  updateBooking: updateBooking2,
  confirmBooking: confirmBooking2,
  cancelBooking: cancelBooking2,
  completeBooking: completeBooking2,
  markNoShowBooking: markNoShowBooking2
};

// src/modules/mentorBookings/mentor.booking.route.ts
var router33 = Router33();
router33.post(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(createMentorBookingValidation),
  mentorBookingController.createBooking
);
router33.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(queryMentorBookingValidation),
  mentorBookingController.getMyMemberBookings
);
router33.get(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(mentorBookingIdValidation),
  mentorBookingController.getMyMemberSingleBooking
);
router33.patch(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(updateMentorBookingValidation),
  mentorBookingController.updateBooking
);
router33.patch(
  "/me/:id/cancel",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(cancelMentorBookingValidation),
  mentorBookingController.cancelBooking
);
router33.get(
  "/mentor/me",
  verifyToken,
  validateRequest_default(queryMentorBookingValidation),
  mentorBookingController.getMyMentorBookings
);
router33.get(
  "/mentor/me/:id",
  verifyToken,
  validateRequest_default(mentorBookingIdValidation),
  mentorBookingController.getMyMentorSingleBooking
);
router33.patch(
  "/:id/confirm",
  verifyToken,
  validateRequest_default(confirmMentorBookingValidation),
  mentorBookingController.confirmBooking
);
router33.patch(
  "/:id/complete",
  verifyToken,
  validateRequest_default(completeMentorBookingValidation),
  mentorBookingController.completeBooking
);
router33.patch(
  "/:id/no-show",
  verifyToken,
  validateRequest_default(noShowMentorBookingValidation),
  mentorBookingController.markNoShowBooking
);
router33.patch(
  "/:id/cancel",
  verifyToken,
  validateRequest_default(cancelMentorBookingValidation),
  mentorBookingController.cancelBooking
);
router33.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(queryMentorBookingValidation),
  mentorBookingController.getAllBookingsAdmin
);
router33.get(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(mentorBookingIdValidation),
  mentorBookingController.getSingleBookingAdmin
);
router33.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(updateMentorBookingValidation),
  mentorBookingController.updateBooking
);
var mentorBookingRoutes = router33;

// src/modules/retreatBatches/retreat.batch.route.ts
import { Router as Router34 } from "express";

// src/modules/retreatBatches/retreat.batch.service.ts
import { Types as Types37 } from "mongoose";
var throwServiceError20 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound20 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError20(message, statusCode);
  }
};
var assertValidObjectId17 = (value, fieldName) => {
  if (!Types37.ObjectId.isValid(value)) {
    throwServiceError20(`${fieldName} is invalid`, 400);
  }
};
var slugify2 = (text) => {
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-");
};
var BATCH_POPULATE = [
  {
    path: "retreatLocation",
    select: "title slug country city coverImage tagline promoVideoUrl whatsIncluded status"
  },
  {
    path: "createdBy",
    select: "fullName email role"
  },
  {
    path: "updatedBy",
    select: "fullName email role"
  }
];
var createRetreatBatch = async (payload, actorId) => {
  assertValidObjectId17(payload.retreatLocation, "Retreat location ID");
  const location = await RetreatLocation.findById(payload.retreatLocation);
  assertFound20(location, "Parent retreat location not found", 404);
  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throwServiceError20("Invalid startDate or endDate format", 400);
  }
  if (endDate <= startDate) {
    throwServiceError20("endDate must be strictly after startDate", 400);
  }
  const slug = payload.slug ? slugify2(payload.slug) : slugify2(`${location.slug}-${payload.batchName}`);
  const existing = await RetreatBatch.findOne({ slug });
  if (existing) {
    throwServiceError20("A retreat batch with this slug already exists", 409);
  }
  const createData = {
    retreatLocation: location._id,
    batchName: payload.batchName,
    slug,
    startDate,
    endDate,
    capacity: payload.capacity,
    confirmedBookingsCount: 0,
    waitlistCount: 0,
    price: payload.price,
    currency: (payload.currency ?? "usd").toLowerCase(),
    status: payload.status ?? "upcoming",
    isFeatured: payload.isFeatured ?? false,
    isActive: payload.isActive ?? true,
    createdBy: new Types37.ObjectId(actorId)
  };
  if (payload.depositAmount !== void 0) {
    createData.depositAmount = payload.depositAmount;
  }
  if (payload.bookingDeadline !== void 0) {
    createData.bookingDeadline = new Date(payload.bookingDeadline);
  }
  if (payload.description !== void 0) {
    createData.description = payload.description;
  }
  if (payload.notes !== void 0) {
    createData.notes = payload.notes;
  }
  const batch = await RetreatBatch.create(createData);
  return batch.populate(BATCH_POPULATE);
};
var getAllRetreatBatches = async (query = {}, isPublicOnly = false) => {
  const filter = {};
  if (query.locationId) {
    assertValidObjectId17(query.locationId, "Retreat location ID");
    filter.retreatLocation = new Types37.ObjectId(query.locationId);
  }
  if (isPublicOnly) {
    filter.status = { $in: ["upcoming", "open", "sold_out"] };
    filter.isActive = true;
  } else {
    if (query.status) {
      filter.status = query.status;
    }
    if (query.isActive !== void 0) {
      filter.isActive = query.isActive;
    }
  }
  if (query.isFeatured !== void 0) {
    filter.isFeatured = query.isFeatured;
  }
  if (query.startDateFrom || query.startDateTo) {
    const timeFilter = {};
    if (query.startDateFrom) {
      timeFilter.$gte = new Date(query.startDateFrom);
    }
    if (query.startDateTo) {
      timeFilter.$lte = new Date(query.startDateTo);
    }
    filter.startDate = timeFilter;
  }
  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [{ batchName: regex }, { description: regex }];
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [batches, total] = await Promise.all([
    RetreatBatch.find(filter).sort({ startDate: 1 }).skip(skip).limit(limit).populate(BATCH_POPULATE),
    RetreatBatch.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: batches
  };
};
var getSingleRetreatBatch = async (idOrSlug, isPublicOnly = false) => {
  const filter = {};
  if (Types37.ObjectId.isValid(idOrSlug)) {
    filter._id = new Types37.ObjectId(idOrSlug);
  } else {
    filter.slug = idOrSlug.toLowerCase();
  }
  if (isPublicOnly) {
    filter.isActive = true;
  }
  const batch = await RetreatBatch.findOne(filter).populate(BATCH_POPULATE);
  assertFound20(batch, "Retreat batch not found", 404);
  return batch;
};
var updateRetreatBatch = async (batchId, payload, actorId) => {
  assertValidObjectId17(batchId, "Retreat batch ID");
  const batch = await RetreatBatch.findById(batchId);
  assertFound20(batch, "Retreat batch not found", 404);
  if (payload.retreatLocation) {
    assertValidObjectId17(payload.retreatLocation, "Retreat location ID");
    const location = await RetreatLocation.findById(payload.retreatLocation);
    assertFound20(location, "Parent retreat location not found", 404);
    batch.retreatLocation = location._id;
  }
  if (payload.batchName !== void 0) {
    batch.batchName = payload.batchName;
  }
  if (payload.slug !== void 0) {
    const slug = slugify2(payload.slug);
    const existing = await RetreatBatch.findOne({
      slug,
      _id: { $ne: batch._id }
    });
    if (existing) {
      throwServiceError20("A retreat batch with this slug already exists", 409);
    }
    batch.slug = slug;
  }
  if (payload.startDate !== void 0) {
    batch.startDate = new Date(payload.startDate);
  }
  if (payload.endDate !== void 0) {
    batch.endDate = new Date(payload.endDate);
  }
  if (batch.endDate <= batch.startDate) {
    throwServiceError20("endDate must be strictly after startDate", 400);
  }
  if (payload.capacity !== void 0) {
    if (payload.capacity < batch.confirmedBookingsCount) {
      throwServiceError20(
        `Capacity cannot be reduced below the current confirmed bookings count (${batch.confirmedBookingsCount})`,
        400
      );
    }
    batch.capacity = payload.capacity;
    if (batch.confirmedBookingsCount >= batch.capacity && batch.status === "open") {
      batch.status = "sold_out";
    }
  }
  if (payload.price !== void 0) {
    batch.price = payload.price;
  }
  if (payload.depositAmount === null) {
    batch.set("depositAmount", void 0);
  } else if (payload.depositAmount !== void 0) {
    batch.depositAmount = payload.depositAmount;
  }
  if (payload.currency !== void 0) {
    batch.currency = payload.currency.toLowerCase();
  }
  if (payload.status !== void 0) {
    batch.status = payload.status;
  }
  if (payload.isFeatured !== void 0) {
    batch.isFeatured = payload.isFeatured;
  }
  if (payload.isActive !== void 0) {
    batch.isActive = payload.isActive;
  }
  if (payload.bookingDeadline === null) {
    batch.set("bookingDeadline", void 0);
  } else if (payload.bookingDeadline !== void 0) {
    batch.bookingDeadline = new Date(payload.bookingDeadline);
  }
  if (payload.description !== void 0) {
    batch.description = payload.description;
  }
  if (payload.notes !== void 0) {
    batch.notes = payload.notes;
  }
  batch.updatedBy = new Types37.ObjectId(actorId);
  await batch.save();
  return batch.populate(BATCH_POPULATE);
};
var deleteRetreatBatch = async (batchId) => {
  assertValidObjectId17(batchId, "Retreat batch ID");
  const batch = await RetreatBatch.findById(batchId);
  assertFound20(batch, "Retreat batch not found", 404);
  if (batch.confirmedBookingsCount > 0) {
    throwServiceError20(
      "Cannot delete a retreat batch with active confirmed bookings. Please cancel or refund bookings first.",
      400
    );
  }
  await batch.deleteOne();
  return { success: true, message: "Retreat batch deleted successfully" };
};
var retreatBatchService = {
  createRetreatBatch,
  getAllRetreatBatches,
  getSingleRetreatBatch,
  updateRetreatBatch,
  deleteRetreatBatch
};

// src/modules/retreatBatches/retreat.batch.controller.ts
var getAuthUser21 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createRetreatBatch2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser21(req);
    const batch = await retreatBatchService.createRetreatBatch(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Retreat batch created successfully",
      data: batch
    });
  } catch (error) {
    next(error);
  }
};
var getAllRetreatBatches2 = async (req, res, next) => {
  try {
    const isPublicOnly = !req.user || req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager";
    const result = await retreatBatchService.getAllRetreatBatches(
      req.query,
      isPublicOnly
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat batches retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleRetreatBatch2 = async (req, res, next) => {
  try {
    const isPublicOnly = !req.user || req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager";
    const batch = await retreatBatchService.getSingleRetreatBatch(
      String(req.params.idOrSlug),
      isPublicOnly
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat batch retrieved successfully",
      data: batch
    });
  } catch (error) {
    next(error);
  }
};
var updateRetreatBatch2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser21(req);
    const batch = await retreatBatchService.updateRetreatBatch(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat batch updated successfully",
      data: batch
    });
  } catch (error) {
    next(error);
  }
};
var deleteRetreatBatch2 = async (req, res, next) => {
  try {
    getAuthUser21(req);
    const result = await retreatBatchService.deleteRetreatBatch(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
var retreatBatchController = {
  createRetreatBatch: createRetreatBatch2,
  getAllRetreatBatches: getAllRetreatBatches2,
  getSingleRetreatBatch: getSingleRetreatBatch2,
  updateRetreatBatch: updateRetreatBatch2,
  deleteRetreatBatch: deleteRetreatBatch2
};

// src/modules/retreatBatches/retreat.batch.validation.ts
import { z as z26 } from "zod";
var mongoObjectIdSchema18 = z26.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var createRetreatBatchValidation = z26.object({
  body: z26.object({
    retreatLocation: mongoObjectIdSchema18,
    batchName: z26.string().trim().min(2).max(200),
    slug: z26.string().trim().min(2).max(200).optional(),
    startDate: z26.string().datetime({ message: "startDate must be a valid ISO 8601 datetime" }),
    endDate: z26.string().datetime({ message: "endDate must be a valid ISO 8601 datetime" }),
    capacity: z26.number().int().min(1),
    price: z26.number().min(0),
    depositAmount: z26.number().min(0).optional(),
    currency: z26.string().trim().min(2).max(10).optional(),
    status: z26.enum(RETREAT_BATCH_STATUSES).optional(),
    isFeatured: z26.boolean().optional(),
    isActive: z26.boolean().optional(),
    bookingDeadline: z26.string().datetime({ message: "bookingDeadline must be a valid ISO 8601 datetime" }).optional(),
    description: z26.string().trim().max(3e3).optional(),
    notes: z26.string().trim().max(2e3).optional()
  }).strict()
});
var updateRetreatBatchValidation = z26.object({
  params: z26.object({
    id: mongoObjectIdSchema18
  }),
  body: z26.object({
    retreatLocation: mongoObjectIdSchema18.optional(),
    batchName: z26.string().trim().min(2).max(200).optional(),
    slug: z26.string().trim().min(2).max(200).optional(),
    startDate: z26.string().datetime({ message: "startDate must be a valid ISO 8601 datetime" }).optional(),
    endDate: z26.string().datetime({ message: "endDate must be a valid ISO 8601 datetime" }).optional(),
    capacity: z26.number().int().min(1).optional(),
    price: z26.number().min(0).optional(),
    depositAmount: z26.number().min(0).nullable().optional(),
    currency: z26.string().trim().min(2).max(10).optional(),
    status: z26.enum(RETREAT_BATCH_STATUSES).optional(),
    isFeatured: z26.boolean().optional(),
    isActive: z26.boolean().optional(),
    bookingDeadline: z26.string().datetime({ message: "bookingDeadline must be a valid ISO 8601 datetime" }).nullable().optional(),
    description: z26.string().trim().max(3e3).optional(),
    notes: z26.string().trim().max(2e3).optional()
  }).strict()
});
var retreatBatchIdValidation = z26.object({
  params: z26.object({
    id: mongoObjectIdSchema18
  })
});
var queryRetreatBatchValidation = z26.object({
  query: z26.object({
    locationId: mongoObjectIdSchema18.optional(),
    status: z26.enum(RETREAT_BATCH_STATUSES).optional(),
    isActive: z26.coerce.boolean().optional(),
    isFeatured: z26.coerce.boolean().optional(),
    startDateFrom: z26.string().optional(),
    startDateTo: z26.string().optional(),
    search: z26.string().trim().optional(),
    page: z26.coerce.number().int().min(1).optional(),
    limit: z26.coerce.number().int().min(1).max(100).optional()
  }).optional()
});

// src/modules/retreatBatches/retreat.batch.route.ts
var router34 = Router34();
router34.get(
  "/",
  validateRequest_default(queryRetreatBatchValidation),
  retreatBatchController.getAllRetreatBatches
);
router34.get(
  "/:idOrSlug",
  retreatBatchController.getSingleRetreatBatch
);
router34.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(createRetreatBatchValidation),
  retreatBatchController.createRetreatBatch
);
router34.patch(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(updateRetreatBatchValidation),
  retreatBatchController.updateRetreatBatch
);
router34.delete(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(retreatBatchIdValidation),
  retreatBatchController.deleteRetreatBatch
);
var retreatBatchRoutes = router34;

// src/modules/retreatBookings/retreat.booking.route.ts
import { Router as Router35 } from "express";

// src/modules/retreatBookings/retreat.booking.service.ts
import { Types as Types38 } from "mongoose";
import Stripe3 from "stripe";

// src/modules/retreatBookings/retreat.booking.model.schema.ts
import { model as model38, Schema as Schema38 } from "mongoose";

// src/modules/retreatBookings/retreat.booking.interface.ts
var RETREAT_BOOKING_STATUSES = [
  "waitlisted",
  "invited",
  "payment_pending",
  "confirmed",
  "cancelled",
  "refunded"
];

// src/modules/retreatBookings/retreat.booking.model.schema.ts
var emergencyContactSchema = new Schema38(
  {
    name: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 50 },
    relationship: { type: String, trim: true, maxlength: 50 }
  },
  { _id: false }
);
var retreatBookingSchema = new Schema38(
  {
    user: {
      type: Schema38.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    retreatBatch: {
      type: Schema38.Types.ObjectId,
      ref: "RetreatBatch",
      required: true,
      index: true
    },
    retreatLocation: {
      type: Schema38.Types.ObjectId,
      ref: "RetreatLocation",
      required: true,
      index: true
    },
    paymentSession: {
      type: Schema38.Types.ObjectId,
      ref: "PaymentSession"
    },
    status: {
      type: String,
      enum: RETREAT_BOOKING_STATUSES,
      default: "waitlisted",
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true
    },
    stripeCheckoutSessionId: {
      type: String,
      trim: true,
      index: true
    },
    stripePaymentIntentId: {
      type: String,
      trim: true
    },
    checkoutUrl: {
      type: String,
      trim: true
    },
    invitationExpiresAt: {
      type: Date
    },
    paidAt: {
      type: Date
    },
    confirmedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    refundedAt: {
      type: Date
    },
    refundAmount: {
      type: Number,
      min: 0
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2e3
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 2e3
    },
    dietaryRequirements: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    emergencyContact: {
      type: emergencyContactSchema
    },
    createdBy: {
      type: Schema38.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema38.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "retreatbookings"
  }
);
retreatBookingSchema.index({
  user: 1,
  retreatBatch: 1
});
retreatBookingSchema.index({
  retreatBatch: 1,
  status: 1
});
retreatBookingSchema.index({
  user: 1,
  status: 1
});
var RetreatBooking = model38(
  "RetreatBooking",
  retreatBookingSchema
);

// src/modules/retreatBookings/retreat.booking.service.ts
var stripeSecretKey3 = config_default.STRIPE_SECRET_KEY;
var stripe3 = stripeSecretKey3 ? new Stripe3(stripeSecretKey3) : null;
var getStripeClient3 = () => {
  if (!stripe3) {
    throwServiceError21("Stripe is not configured. Please set STRIPE_SECRET_KEY.", 500);
  }
  return stripe3;
};
var throwServiceError21 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound21 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError21(message, statusCode);
  }
};
var assertValidObjectId18 = (value, fieldName) => {
  if (!Types38.ObjectId.isValid(value)) {
    throwServiceError21(`${fieldName} is invalid`, 400);
  }
};
var BOOKING_POPULATE2 = [
  {
    path: "user",
    select: "fullName email role profileImage phone city country"
  },
  {
    path: "retreatBatch",
    select: "batchName slug startDate endDate capacity confirmedBookingsCount waitlistCount price depositAmount currency status isFeatured",
    populate: {
      path: "retreatLocation",
      model: "RetreatLocation",
      select: "title slug country city coverImage tagline"
    }
  },
  {
    path: "retreatLocation",
    select: "title slug country city coverImage tagline whatsIncluded"
  },
  {
    path: "createdBy",
    select: "fullName email role"
  },
  {
    path: "updatedBy",
    select: "fullName email role"
  }
];
var createRetreatBooking = async (payload, userId, actorId) => {
  assertValidObjectId18(payload.retreatBatch, "Retreat batch ID");
  assertValidObjectId18(userId, "User ID");
  const user = await User.findById(userId).select("_id fullName email role");
  assertFound21(user, "User account not found", 404);
  const batch = await RetreatBatch.findById(payload.retreatBatch).populate({
    path: "retreatLocation",
    select: "_id title slug country city"
  });
  assertFound21(batch, "Retreat batch not found", 404);
  if (batch.status === "cancelled" || batch.status === "completed") {
    throwServiceError21(`Cannot join a retreat batch that is ${batch.status}`, 400);
  }
  const activeExistingBooking = await RetreatBooking.findOne({
    user: new Types38.ObjectId(userId),
    retreatBatch: batch._id,
    status: { $in: ["waitlisted", "invited", "payment_pending", "confirmed"] }
  });
  if (activeExistingBooking) {
    throwServiceError21(
      `You already have an active booking (${activeExistingBooking.status}) for this retreat batch`,
      409
    );
  }
  const locationId = batch.retreatLocation._id;
  const createData = {
    user: user._id,
    retreatBatch: batch._id,
    retreatLocation: locationId,
    status: "waitlisted",
    amount: batch.price,
    currency: batch.currency,
    createdBy: new Types38.ObjectId(actorId)
  };
  if (payload.notes !== void 0) {
    createData.notes = payload.notes;
  }
  if (payload.specialRequests !== void 0) {
    createData.specialRequests = payload.specialRequests;
  }
  if (payload.dietaryRequirements !== void 0) {
    createData.dietaryRequirements = payload.dietaryRequirements;
  }
  if (payload.emergencyContact !== void 0) {
    createData.emergencyContact = payload.emergencyContact;
  }
  const booking = await RetreatBooking.create(createData);
  await RetreatBatch.findByIdAndUpdate(batch._id, {
    $inc: { waitlistCount: 1 }
  });
  const createdBookingId = String(booking._id);
  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "retreat_booking_waitlisted",
    fallbackTitle: "Retreat request received",
    fallbackBody: "Your retreat reservation request has been added to the waitlist.",
    recipient: userId,
    actor: actorId,
    variables: {
      bookingId: createdBookingId,
      batchName: batch.batchName
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: createdBookingId,
    metadata: {
      status: booking.status,
      batchId: String(batch._id)
    },
    dedupeKey: `retreat_booking_waitlisted:${createdBookingId}`
  });
  return booking.populate(BOOKING_POPULATE2);
};
var createRetreatBookingCheckoutSession = async ({
  bookingId,
  userId,
  successUrl,
  cancelUrl
}) => {
  assertValidObjectId18(bookingId, "Retreat booking ID");
  assertValidObjectId18(userId, "User ID");
  const booking = await RetreatBooking.findById(bookingId).populate([
    {
      path: "user",
      select: "_id fullName email"
    },
    {
      path: "retreatBatch",
      select: "_id batchName price currency capacity confirmedBookingsCount status",
      populate: {
        path: "retreatLocation",
        model: "RetreatLocation",
        select: "title city country"
      }
    }
  ]);
  assertFound21(booking, "Retreat booking not found", 404);
  if (String(booking.user._id) !== userId) {
    throwServiceError21("You are not authorized to pay for this booking", 403);
  }
  if (booking.status === "confirmed") {
    throwServiceError21("This retreat booking is already confirmed and paid", 400);
  }
  if (booking.status === "cancelled" || booking.status === "refunded") {
    throwServiceError21(`Cannot pay for a ${booking.status} retreat booking`, 400);
  }
  const batch = booking.retreatBatch;
  if (batch.confirmedBookingsCount >= batch.capacity) {
    throwServiceError21(
      "All confirmed seats for this retreat batch are currently sold out",
      409
    );
  }
  const stripeClient = getStripeClient3();
  const user = booking.user;
  const defaultSuccessUrl = `${config_default.FRONTEND_URL || "http://localhost:5173"}/retreats/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`;
  const defaultCancelUrl = `${config_default.FRONTEND_URL || "http://localhost:5173"}/retreats/payment-cancelled?booking_id=${booking._id}`;
  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    client_reference_id: booking._id.toString(),
    metadata: {
      purpose: "retreat_booking",
      bookingId: booking._id.toString(),
      batchId: batch._id.toString(),
      userId: user._id.toString()
    },
    line_items: [
      {
        price_data: {
          currency: batch.currency || "usd",
          product_data: {
            name: `INVICTUS Retreat: ${batch.batchName}`,
            description: batch.retreatLocation ? `Private Luxury Retreat in ${batch.retreatLocation.city}, ${batch.retreatLocation.country}` : "INVICTUS Private Retreat Experience"
          },
          unit_amount: Math.round(batch.price * 100)
        },
        quantity: 1
      }
    ],
    success_url: successUrl || defaultSuccessUrl,
    cancel_url: cancelUrl || defaultCancelUrl
  });
  booking.stripeCheckoutSessionId = session.id;
  booking.checkoutUrl = session.url ?? void 0;
  booking.status = "payment_pending";
  booking.updatedBy = new Types38.ObjectId(userId);
  await booking.save();
  return {
    bookingId: booking._id,
    stripeCheckoutSessionId: session.id,
    checkoutUrl: session.url
  };
};
var verifyRetreatBookingPayment = async (sessionId) => {
  if (!sessionId || !sessionId.trim()) {
    throwServiceError21("Stripe checkout session ID is required", 400);
  }
  const stripeClient = getStripeClient3();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return {
      paid: false,
      message: "Payment has not been completed on Stripe"
    };
  }
  const bookingId = session.metadata?.bookingId || session.client_reference_id;
  if (!bookingId) {
    throwServiceError21("Booking ID missing from Stripe checkout metadata", 400);
  }
  const booking = await RetreatBooking.findById(bookingId);
  assertFound21(booking, "Retreat booking not found", 404);
  if (booking.status === "confirmed") {
    return {
      paid: true,
      message: "Retreat booking is already confirmed",
      booking: await booking.populate(BOOKING_POPULATE2)
    };
  }
  const previousStatus = booking.status;
  const existingBatch = await RetreatBatch.findById(booking.retreatBatch);
  assertFound21(existingBatch, "Retreat batch not found", 404);
  if (existingBatch.confirmedBookingsCount >= existingBatch.capacity) {
    throwServiceError21("Capacity exceeded. This retreat batch is completely full.", 409);
  }
  const batch = await RetreatBatch.findOneAndUpdate(
    {
      _id: existingBatch._id,
      confirmedBookingsCount: { $lt: existingBatch.capacity }
    },
    {
      $inc: {
        confirmedBookingsCount: 1,
        ...previousStatus === "waitlisted" ? { waitlistCount: -1 } : {}
      }
    },
    { new: true }
  );
  if (!batch) {
    throwServiceError21(
      "Capacity exceeded. This retreat batch is completely full.",
      409
    );
    throw new Error("Unreachable");
  }
  if (batch.confirmedBookingsCount >= batch.capacity && batch.status === "open") {
    batch.status = "sold_out";
    await batch.save();
  }
  const paidAmount = session.amount_total ? session.amount_total / 100 : booking.amount;
  booking.status = "confirmed";
  booking.amountPaid = paidAmount;
  booking.paidAt = /* @__PURE__ */ new Date();
  booking.confirmedAt = /* @__PURE__ */ new Date();
  booking.stripeCheckoutSessionId = session.id;
  if (typeof session.payment_intent === "string") {
    booking.stripePaymentIntentId = session.payment_intent;
  }
  await booking.save();
  const paidBookingId = String(booking._id);
  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "retreat_booking_confirmed",
    fallbackTitle: "Retreat booking confirmed",
    fallbackBody: "Your retreat booking payment was verified and your seat is confirmed.",
    recipient: String(booking.user),
    variables: {
      bookingId: paidBookingId,
      amountPaid: paidAmount,
      currency: booking.currency
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: paidBookingId,
    metadata: {
      status: booking.status,
      paymentStatus: "paid",
      amountPaid: paidAmount
    },
    dedupeKey: `retreat_booking_confirmed:${paidBookingId}`
  });
  return {
    paid: true,
    message: "Retreat booking confirmed and payment verified successfully",
    booking: await booking.populate(BOOKING_POPULATE2)
  };
};
var inviteRetreatBooking = async (bookingId, payload, actorId) => {
  assertValidObjectId18(bookingId, "Retreat booking ID");
  const booking = await RetreatBooking.findById(bookingId);
  assertFound21(booking, "Retreat booking not found", 404);
  if (booking.status === "confirmed") {
    throwServiceError21("Cannot invite a member whose booking is already confirmed", 400);
  }
  const hours = payload.invitationExpiresInHours ?? 72;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1e3);
  const previousStatus = booking.status;
  booking.status = "invited";
  booking.invitationExpiresAt = expiresAt;
  if (payload.notes !== void 0) {
    booking.notes = payload.notes;
  }
  booking.updatedBy = new Types38.ObjectId(actorId);
  await booking.save();
  if (previousStatus === "waitlisted") {
    await RetreatBatch.findByIdAndUpdate(booking.retreatBatch, {
      $inc: { waitlistCount: -1 }
    });
  }
  const invitedBookingId = String(booking._id);
  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "retreat_booking_invited",
    fallbackTitle: "You have been invited to the retreat",
    fallbackBody: "Your retreat waitlist request has been invited. Please complete the next required step before the invitation expires.",
    recipient: String(booking.user),
    actor: actorId,
    variables: {
      bookingId: invitedBookingId,
      invitationExpiresAt: expiresAt.toISOString()
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: invitedBookingId,
    metadata: {
      status: booking.status,
      invitationExpiresAt: expiresAt.toISOString()
    },
    dedupeKey: `retreat_booking_invited:${invitedBookingId}:${expiresAt.getTime()}`
  });
  return booking.populate(BOOKING_POPULATE2);
};
var confirmRetreatBookingAdmin = async (bookingId, payload, actorId) => {
  const test = assertValidObjectId18(bookingId, "Retreat booking ID");
  const booking = await RetreatBooking.findById(bookingId);
  assertFound21(booking, "Retreat booking not found", 404);
  if (booking.status === "confirmed") {
    throwServiceError21("Booking is already confirmed", 400);
  }
  const previousStatus = booking.status;
  const batch = await RetreatBatch.findById(booking.retreatBatch);
  assertFound21(batch, "Retreat batch not found", 404);
  if (batch.confirmedBookingsCount >= batch.capacity) {
    throwServiceError21(
      `Cannot confirm booking: Batch capacity (${batch.capacity}) is already reached.`,
      409
    );
  }
  batch.confirmedBookingsCount += 1;
  if (previousStatus === "waitlisted" && batch.waitlistCount > 0) {
    batch.waitlistCount -= 1;
  }
  if (batch.confirmedBookingsCount >= batch.capacity && batch.status === "open") {
    batch.status = "sold_out";
  }
  await batch.save();
  booking.status = "confirmed";
  booking.amountPaid = payload.amountPaid ?? booking.amount;
  booking.confirmedAt = /* @__PURE__ */ new Date();
  booking.paidAt = /* @__PURE__ */ new Date();
  if (payload.notes !== void 0) {
    booking.notes = payload.notes;
  }
  booking.updatedBy = new Types38.ObjectId(actorId);
  await booking.save();
  const confirmedBookingId = String(booking._id);
  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "retreat_booking_confirmed",
    fallbackTitle: "Retreat booking confirmed",
    fallbackBody: "Your retreat booking has been confirmed.",
    recipient: String(booking.user),
    actor: actorId,
    variables: {
      bookingId: confirmedBookingId,
      amountPaid: booking.amountPaid ?? booking.amount,
      currency: booking.currency
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: confirmedBookingId,
    metadata: {
      status: booking.status,
      amountPaid: booking.amountPaid ?? booking.amount
    },
    dedupeKey: `retreat_booking_confirmed:${confirmedBookingId}`
  });
  return booking.populate(BOOKING_POPULATE2);
};
var cancelRetreatBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole
}) => {
  assertValidObjectId18(bookingId, "Retreat booking ID");
  const booking = await RetreatBooking.findById(bookingId);
  assertFound21(booking, "Retreat booking not found", 404);
  const isOwner = String(booking.user) === actorId;
  const isAdmin = actorRole === "admin" || actorRole === "manager" || actorRole === "founder" || actorRole === "super_admin";
  if (!isOwner && !isAdmin) {
    throwServiceError21("You are not authorized to cancel this retreat booking", 403);
  }
  if (booking.status === "cancelled") {
    throwServiceError21("Retreat booking is already cancelled", 400);
  }
  if (booking.status === "refunded") {
    throwServiceError21("Refunded retreat booking cannot be cancelled", 400);
  }
  const previousStatus = booking.status;
  booking.status = "cancelled";
  booking.cancellationReason = payload.reason;
  booking.cancelledAt = /* @__PURE__ */ new Date();
  booking.updatedBy = new Types38.ObjectId(actorId);
  await booking.save();
  const batch = await RetreatBatch.findById(booking.retreatBatch);
  if (batch) {
    if (previousStatus === "confirmed" && batch.confirmedBookingsCount > 0) {
      batch.confirmedBookingsCount -= 1;
      if (batch.status === "sold_out") {
        batch.status = "open";
      }
    } else if (previousStatus === "waitlisted" && batch.waitlistCount > 0) {
      batch.waitlistCount -= 1;
    }
    await batch.save();
  }
  const cancelledBookingId = String(booking._id);
  if (String(booking.user) !== actorId) {
    await notificationService.safeCreateFromTemplateOrFallback({
      templateKey: "retreat_booking_cancelled",
      fallbackTitle: "Retreat booking cancelled",
      fallbackBody: `Your retreat booking has been cancelled. Reason: ${payload.reason}`,
      recipient: String(booking.user),
      actor: actorId,
      variables: {
        bookingId: cancelledBookingId,
        reason: payload.reason
      },
      relatedEntityType: "RetreatBooking",
      relatedEntityId: cancelledBookingId,
      metadata: {
        status: booking.status,
        reason: payload.reason
      },
      dedupeKey: `retreat_booking_cancelled:${cancelledBookingId}`
    });
  }
  return booking.populate(BOOKING_POPULATE2);
};
var refundRetreatBooking = async (bookingId, payload, actorId) => {
  assertValidObjectId18(bookingId, "Retreat booking ID");
  const booking = await RetreatBooking.findById(bookingId);
  assertFound21(booking, "Retreat booking not found", 404);
  if (booking.status !== "confirmed") {
    throwServiceError21("Only confirmed retreat bookings can be refunded", 400);
  }
  booking.status = "refunded";
  booking.refundedAt = /* @__PURE__ */ new Date();
  booking.refundAmount = payload.refundAmount ?? booking.amountPaid ?? booking.amount;
  if (payload.reason !== void 0) {
    booking.refundReason = payload.reason;
  }
  booking.updatedBy = new Types38.ObjectId(actorId);
  await booking.save();
  const batch = await RetreatBatch.findById(booking.retreatBatch);
  if (batch && batch.confirmedBookingsCount > 0) {
    batch.confirmedBookingsCount -= 1;
    if (batch.status === "sold_out") {
      batch.status = "open";
    }
    await batch.save();
  }
  const refundedBookingId = String(booking._id);
  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "retreat_booking_refunded",
    fallbackTitle: "Retreat booking refunded",
    fallbackBody: "Your retreat booking has been marked as refunded.",
    recipient: String(booking.user),
    actor: actorId,
    variables: {
      bookingId: refundedBookingId,
      refundAmount: booking.refundAmount ?? 0,
      currency: booking.currency,
      reason: booking.refundReason ?? ""
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: refundedBookingId,
    metadata: {
      status: booking.status,
      refundAmount: booking.refundAmount ?? null,
      reason: booking.refundReason ?? null
    },
    dedupeKey: `retreat_booking_refunded:${refundedBookingId}`
  });
  return booking.populate(BOOKING_POPULATE2);
};
var updateRetreatBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole
}) => {
  assertValidObjectId18(bookingId, "Retreat booking ID");
  const booking = await RetreatBooking.findById(bookingId);
  assertFound21(booking, "Retreat booking not found", 404);
  const isOwner = String(booking.user) === actorId;
  const isAdmin = actorRole === "admin" || actorRole === "manager" || actorRole === "founder" || actorRole === "super_admin";
  if (!isOwner && !isAdmin) {
    throwServiceError21("You are not authorized to update this retreat booking", 403);
  }
  if (payload.notes !== void 0) {
    booking.notes = payload.notes;
  }
  if (payload.specialRequests !== void 0) {
    booking.specialRequests = payload.specialRequests;
  }
  if (payload.dietaryRequirements !== void 0) {
    booking.dietaryRequirements = payload.dietaryRequirements;
  }
  if (payload.emergencyContact !== void 0) {
    booking.emergencyContact = payload.emergencyContact;
  }
  booking.updatedBy = new Types38.ObjectId(actorId);
  await booking.save();
  return booking.populate(BOOKING_POPULATE2);
};
var getMyRetreatBookings = async (userId, query = {}) => {
  assertValidObjectId18(userId, "User ID");
  const filter = {
    user: new Types38.ObjectId(userId)
  };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.batchId) {
    assertValidObjectId18(query.batchId, "Retreat batch ID");
    filter.retreatBatch = new Types38.ObjectId(query.batchId);
  }
  if (query.locationId) {
    assertValidObjectId18(query.locationId, "Retreat location ID");
    filter.retreatLocation = new Types38.ObjectId(query.locationId);
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    RetreatBooking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE2),
    RetreatBooking.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: bookings
  };
};
var getMySingleRetreatBooking = async (bookingId, userId) => {
  assertValidObjectId18(bookingId, "Retreat booking ID");
  assertValidObjectId18(userId, "User ID");
  const booking = await RetreatBooking.findOne({
    _id: new Types38.ObjectId(bookingId),
    user: new Types38.ObjectId(userId)
  }).populate(BOOKING_POPULATE2);
  assertFound21(booking, "Retreat booking not found", 404);
  return booking;
};
var getAllRetreatBookingsAdmin = async (query = {}) => {
  const filter = {};
  if (query.userId) {
    assertValidObjectId18(query.userId, "User ID");
    filter.user = new Types38.ObjectId(query.userId);
  }
  if (query.batchId) {
    assertValidObjectId18(query.batchId, "Retreat batch ID");
    filter.retreatBatch = new Types38.ObjectId(query.batchId);
  }
  if (query.locationId) {
    assertValidObjectId18(query.locationId, "Retreat location ID");
    filter.retreatLocation = new Types38.ObjectId(query.locationId);
  }
  if (query.status) {
    filter.status = query.status;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    RetreatBooking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE2),
    RetreatBooking.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: bookings
  };
};
var getSingleRetreatBookingAdmin = async (bookingId) => {
  assertValidObjectId18(bookingId, "Retreat booking ID");
  const booking = await RetreatBooking.findById(bookingId).populate(
    BOOKING_POPULATE2
  );
  assertFound21(booking, "Retreat booking not found", 404);
  return booking;
};
var retreatBookingService = {
  createRetreatBooking,
  createRetreatBookingCheckoutSession,
  verifyRetreatBookingPayment,
  inviteRetreatBooking,
  confirmRetreatBookingAdmin,
  cancelRetreatBooking,
  refundRetreatBooking,
  updateRetreatBooking,
  getMyRetreatBookings,
  getMySingleRetreatBooking,
  getAllRetreatBookingsAdmin,
  getSingleRetreatBookingAdmin
};

// src/modules/retreatBookings/retreat.booking.controller.ts
var getAuthUser22 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createRetreatBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const booking = await retreatBookingService.createRetreatBooking(
      req.body,
      authUser.id,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Retreat reservation / waitlist request submitted successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var createCheckoutSession2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const result = await retreatBookingService.createRetreatBookingCheckoutSession({
      bookingId: String(req.params.id),
      userId: authUser.id,
      successUrl: req.body?.successUrl,
      cancelUrl: req.body?.cancelUrl
    });
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
var verifyPayment = async (req, res, next) => {
  try {
    const sessionId = req.body?.sessionId || req.query.sessionId;
    const result = await retreatBookingService.verifyRetreatBookingPayment(sessionId);
    sendResponse_default(res, {
      statusCode: 200,
      success: result.paid,
      message: result.message,
      data: result.booking ?? null
    });
  } catch (error) {
    next(error);
  }
};
var getMyRetreatBookings2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const result = await retreatBookingService.getMyRetreatBookings(
      authUser.id,
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "My retreat bookings retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMySingleRetreatBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const booking = await retreatBookingService.getMySingleRetreatBooking(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking retrieved successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var updateRetreatBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const booking = await retreatBookingService.updateRetreatBooking({
      bookingId: String(req.params.id),
      payload: req.body,
      actorId: authUser.id,
      actorRole: authUser.role
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking details updated successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var cancelRetreatBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const booking = await retreatBookingService.cancelRetreatBooking({
      bookingId: String(req.params.id),
      payload: req.body,
      actorId: authUser.id,
      actorRole: authUser.role
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking cancelled successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var inviteRetreatBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const booking = await retreatBookingService.inviteRetreatBooking(
      req.params.id,
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Member invited to retreat batch successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var confirmRetreatBookingAdmin2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const booking = await retreatBookingService.confirmRetreatBookingAdmin(
      req.params.id,
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking confirmed by administrator",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var refundRetreatBooking2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser22(req);
    const booking = await retreatBookingService.refundRetreatBooking(
      req.params.id,
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking marked as refunded",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var getAllRetreatBookingsAdmin2 = async (req, res, next) => {
  try {
    getAuthUser22(req);
    const result = await retreatBookingService.getAllRetreatBookingsAdmin(
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All retreat bookings retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleRetreatBookingAdmin2 = async (req, res, next) => {
  try {
    getAuthUser22(req);
    const booking = await retreatBookingService.getSingleRetreatBookingAdmin(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking retrieved successfully",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
var retreatBookingController = {
  createRetreatBooking: createRetreatBooking2,
  createCheckoutSession: createCheckoutSession2,
  verifyPayment,
  getMyRetreatBookings: getMyRetreatBookings2,
  getMySingleRetreatBooking: getMySingleRetreatBooking2,
  updateRetreatBooking: updateRetreatBooking2,
  cancelRetreatBooking: cancelRetreatBooking2,
  inviteRetreatBooking: inviteRetreatBooking2,
  confirmRetreatBookingAdmin: confirmRetreatBookingAdmin2,
  refundRetreatBooking: refundRetreatBooking2,
  getAllRetreatBookingsAdmin: getAllRetreatBookingsAdmin2,
  getSingleRetreatBookingAdmin: getSingleRetreatBookingAdmin2
};

// src/modules/retreatBookings/retreat.booking.validation.ts
import { z as z27 } from "zod";
var mongoObjectIdSchema19 = z27.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var emergencyContactSchema2 = z27.object({
  name: z27.string().trim().max(100).optional(),
  phone: z27.string().trim().max(50).optional(),
  relationship: z27.string().trim().max(50).optional()
}).optional();
var createRetreatBookingValidation = z27.object({
  body: z27.object({
    retreatBatch: mongoObjectIdSchema19,
    notes: z27.string().trim().max(2e3).optional(),
    specialRequests: z27.string().trim().max(2e3).optional(),
    dietaryRequirements: z27.string().trim().max(1e3).optional(),
    emergencyContact: emergencyContactSchema2
  }).strict()
});
var updateRetreatBookingValidation = z27.object({
  params: z27.object({
    id: mongoObjectIdSchema19
  }),
  body: z27.object({
    notes: z27.string().trim().max(2e3).optional(),
    specialRequests: z27.string().trim().max(2e3).optional(),
    dietaryRequirements: z27.string().trim().max(1e3).optional(),
    emergencyContact: emergencyContactSchema2
  }).strict()
});
var inviteRetreatBookingValidation = z27.object({
  params: z27.object({
    id: mongoObjectIdSchema19
  }),
  body: z27.object({
    invitationExpiresInHours: z27.number().int().min(1).max(720).optional(),
    notes: z27.string().trim().max(2e3).optional()
  }).strict()
});
var cancelRetreatBookingValidation = z27.object({
  params: z27.object({
    id: mongoObjectIdSchema19
  }),
  body: z27.object({
    reason: z27.string().trim().min(3, "Cancellation reason must be at least 3 characters").max(1e3)
  }).strict()
});
var refundRetreatBookingValidation = z27.object({
  params: z27.object({
    id: mongoObjectIdSchema19
  }),
  body: z27.object({
    refundAmount: z27.number().min(0).optional(),
    reason: z27.string().trim().max(1e3).optional()
  }).strict()
});
var confirmRetreatBookingAdminValidation = z27.object({
  params: z27.object({
    id: mongoObjectIdSchema19
  }),
  body: z27.object({
    amountPaid: z27.number().min(0).optional(),
    notes: z27.string().trim().max(2e3).optional()
  }).strict()
});
var retreatBookingIdValidation = z27.object({
  params: z27.object({
    id: mongoObjectIdSchema19
  })
});
var queryRetreatBookingValidation = z27.object({
  query: z27.object({
    userId: mongoObjectIdSchema19.optional(),
    batchId: mongoObjectIdSchema19.optional(),
    locationId: mongoObjectIdSchema19.optional(),
    status: z27.enum(RETREAT_BOOKING_STATUSES).optional(),
    search: z27.string().trim().optional(),
    page: z27.coerce.number().int().min(1).optional(),
    limit: z27.coerce.number().int().min(1).max(100).optional()
  }).optional()
});

// src/modules/retreatBookings/retreat.booking.route.ts
var router35 = Router35();
router35.post(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(createRetreatBookingValidation),
  retreatBookingController.createRetreatBooking
);
router35.get(
  "/me",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(queryRetreatBookingValidation),
  retreatBookingController.getMyRetreatBookings
);
router35.get(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(retreatBookingIdValidation),
  retreatBookingController.getMySingleRetreatBooking
);
router35.patch(
  "/me/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(updateRetreatBookingValidation),
  retreatBookingController.updateRetreatBooking
);
router35.patch(
  "/me/:id/cancel",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(cancelRetreatBookingValidation),
  retreatBookingController.cancelRetreatBooking
);
router35.post(
  "/me/:id/checkout",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(retreatBookingIdValidation),
  retreatBookingController.createCheckoutSession
);
router35.post(
  "/verify-payment",
  verifyToken,
  retreatBookingController.verifyPayment
);
router35.patch(
  "/:id/invite",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(inviteRetreatBookingValidation),
  retreatBookingController.inviteRetreatBooking
);
router35.patch(
  "/:id/confirm",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(confirmRetreatBookingAdminValidation),
  retreatBookingController.confirmRetreatBookingAdmin
);
router35.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(cancelRetreatBookingValidation),
  retreatBookingController.cancelRetreatBooking
);
router35.patch(
  "/:id/refund",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(refundRetreatBookingValidation),
  retreatBookingController.refundRetreatBooking
);
router35.get(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(queryRetreatBookingValidation),
  retreatBookingController.getAllRetreatBookingsAdmin
);
router35.get(
  "/:id",
  verifyToken,
  authorizeRoles("founder", "super_admin", "admin", "manager"),
  validateRequest_default(retreatBookingIdValidation),
  retreatBookingController.getSingleRetreatBookingAdmin
);
var retreatBookingRoutes = router35;

// src/modules/paymentPlans/payment.plan.route.ts
import { Router as Router36 } from "express";

// src/modules/paymentPlans/payment.plan.service.ts
import {
  Types as Types39
} from "mongoose";
var throwServiceError22 = (message, statusCode) => {
  const error = new Error(
    message
  );
  error.statusCode = statusCode;
  throw error;
};
var assertFound22 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError22(
      message,
      statusCode
    );
  }
};
var assertValidObjectId19 = (value, fieldName) => {
  if (!Types39.ObjectId.isValid(value)) {
    throwServiceError22(
      `${fieldName} is invalid`,
      400
    );
  }
};
var isDuplicateKeyError11 = (error) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11e3;
};
var productModelMap = {
  ChallengePillar: {
    findById: (id3) => ChallengePillar.findById(id3)
  },
  RetreatBatch: {
    findById: (id3) => RetreatBatch.findById(id3)
  }
};
var ensureProductReferenceIsValid = async ({
  productType,
  product,
  productRefModel
}) => {
  if (productType === "membership" || productType === "other") {
    return;
  }
  if (!product || !productRefModel) {
    throwServiceError22(
      "product and productRefModel are required for this productType",
      400
    );
  }
  assertValidObjectId19(
    product,
    "Product ID"
  );
  const expectedRefModel = productType === "pillar" ? "ChallengePillar" : productType === "retreat" ? "RetreatBatch" : void 0;
  if (expectedRefModel && productRefModel !== expectedRefModel) {
    throwServiceError22(
      `productRefModel must be ${expectedRefModel} for productType "${productType}"`,
      400
    );
  }
  const lookup = productModelMap[productRefModel];
  if (!lookup) {
    throwServiceError22(
      "Unsupported productRefModel",
      400
    );
  }
  const referencedProduct = await lookup.findById(
    product
  );
  assertFound22(
    referencedProduct,
    "Referenced product not found",
    404
  );
};
var createPaymentPlan = async (payload, actorId) => {
  await ensureProductReferenceIsValid(
    {
      productType: payload.productType,
      product: payload.product,
      productRefModel: payload.productRefModel
    }
  );
  if (payload.mode === "subscription" && !payload.interval) {
    throwServiceError22(
      "interval is required when mode is subscription",
      400
    );
  }
  const createData = {
    name: payload.name,
    slug: payload.slug.trim().toLowerCase(),
    productType: payload.productType,
    mode: payload.mode,
    amountCents: payload.amountCents,
    currency: payload.currency ?? "usd",
    order: payload.order ?? 1,
    status: "draft",
    isActive: true,
    createdBy: new Types39.ObjectId(actorId)
  };
  if (payload.description !== void 0) {
    createData.description = payload.description;
  }
  if (payload.product !== void 0) {
    createData.product = new Types39.ObjectId(
      payload.product
    );
    createData.productRefModel = payload.productRefModel;
  }
  if (payload.interval !== void 0) {
    createData.interval = payload.interval;
    createData.intervalCount = payload.intervalCount ?? 1;
  }
  if (payload.stripeProductId !== void 0) {
    createData.stripeProductId = payload.stripeProductId;
  }
  if (payload.stripePriceId !== void 0) {
    createData.stripePriceId = payload.stripePriceId;
  }
  try {
    const plan = await PaymentPlan.create(
      createData
    );
    return plan.populate(
      "createdBy",
      "fullName email role profileImage"
    );
  } catch (error) {
    if (isDuplicateKeyError11(error)) {
      throwServiceError22(
        "A payment plan with this slug or product/mode combination already exists",
        409
      );
    }
    throw error;
  }
};
var getAllPaymentPlans = async ({
  productType,
  mode,
  status,
  includeArchived = false
}) => {
  const filter = {};
  if (productType) {
    filter.productType = productType;
  }
  if (mode) {
    filter.mode = mode;
  }
  if (status) {
    filter.status = status;
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived"
    };
  }
  return PaymentPlan.find(filter).sort({
    productType: 1,
    order: 1
  }).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
};
var getSinglePaymentPlan = async (planId) => {
  assertValidObjectId19(
    planId,
    "Payment plan ID"
  );
  const plan = await PaymentPlan.findById(
    planId
  ).populate(
    "createdBy",
    "fullName email role profileImage"
  ).populate(
    "updatedBy",
    "fullName email role profileImage"
  );
  assertFound22(
    plan,
    "Payment plan not found",
    404
  );
  return plan;
};
var getPaymentPlanBySlug = async (slug) => {
  const plan = await PaymentPlan.findOne({
    slug: slug.trim().toLowerCase(),
    status: { $ne: "archived" }
  });
  assertFound22(
    plan,
    "Payment plan not found",
    404
  );
  return plan;
};
var updatePaymentPlan = async (planId, payload, actorId) => {
  assertValidObjectId19(
    planId,
    "Payment plan ID"
  );
  const plan = await PaymentPlan.findById(
    planId
  );
  assertFound22(
    plan,
    "Payment plan not found",
    404
  );
  if (plan.status === "archived") {
    throwServiceError22(
      "Archived payment plan cannot be updated",
      400
    );
  }
  const nextProductType = payload.productType ?? plan.productType;
  const nextProduct = payload.product === null ? void 0 : payload.product ?? plan.product?.toString();
  const nextProductRefModel = payload.productRefModel === null ? void 0 : payload.productRefModel ?? plan.productRefModel;
  if (payload.productType !== void 0 || payload.product !== void 0 || payload.productRefModel !== void 0) {
    await ensureProductReferenceIsValid(
      {
        productType: nextProductType,
        product: nextProduct,
        productRefModel: nextProductRefModel
      }
    );
  }
  if (payload.name !== void 0) {
    plan.name = payload.name;
  }
  if (payload.slug !== void 0) {
    plan.slug = payload.slug.trim().toLowerCase();
  }
  if (payload.description === null) {
    plan.set(
      "description",
      void 0
    );
  } else if (payload.description !== void 0) {
    plan.description = payload.description;
  }
  if (payload.productType !== void 0) {
    plan.productType = payload.productType;
  }
  if (payload.product === null) {
    plan.set("product", void 0);
    plan.set(
      "productRefModel",
      void 0
    );
  } else if (payload.product !== void 0) {
    plan.product = new Types39.ObjectId(
      payload.product
    );
  }
  if (payload.productRefModel === null) {
    plan.set(
      "productRefModel",
      void 0
    );
  } else if (payload.productRefModel !== void 0) {
    plan.productRefModel = payload.productRefModel;
  }
  if (payload.mode !== void 0) {
    plan.mode = payload.mode;
  }
  if (plan.mode === "subscription" && !plan.interval && payload.interval === void 0) {
    throwServiceError22(
      "interval is required when mode is subscription",
      400
    );
  }
  if (payload.amountCents !== void 0) {
    plan.amountCents = payload.amountCents;
  }
  if (payload.currency !== void 0) {
    plan.currency = payload.currency;
  }
  if (payload.interval === null) {
    plan.set("interval", void 0);
  } else if (payload.interval !== void 0) {
    plan.interval = payload.interval;
  }
  if (payload.intervalCount === null) {
    plan.set(
      "intervalCount",
      void 0
    );
  } else if (payload.intervalCount !== void 0) {
    plan.intervalCount = payload.intervalCount;
  }
  if (payload.stripeProductId === null) {
    plan.set(
      "stripeProductId",
      void 0
    );
  } else if (payload.stripeProductId !== void 0) {
    plan.stripeProductId = payload.stripeProductId;
  }
  if (payload.stripePriceId === null) {
    plan.set(
      "stripePriceId",
      void 0
    );
  } else if (payload.stripePriceId !== void 0) {
    plan.stripePriceId = payload.stripePriceId;
  }
  if (payload.order !== void 0) {
    plan.order = payload.order;
  }
  plan.updatedBy = new Types39.ObjectId(actorId);
  try {
    await plan.save();
  } catch (error) {
    if (isDuplicateKeyError11(error)) {
      throwServiceError22(
        "A payment plan with this slug or product/mode combination already exists",
        409
      );
    }
    throw error;
  }
  return plan.populate(
    "updatedBy",
    "fullName email role profileImage"
  );
};
var activatePaymentPlan = async (planId, actorId) => {
  assertValidObjectId19(
    planId,
    "Payment plan ID"
  );
  const plan = await PaymentPlan.findById(
    planId
  );
  assertFound22(
    plan,
    "Payment plan not found",
    404
  );
  if (plan.status === "archived") {
    throwServiceError22(
      "Archived payment plan cannot be activated",
      400
    );
  }
  plan.status = "active";
  plan.isActive = true;
  plan.publishedAt = /* @__PURE__ */ new Date();
  plan.set("archivedAt", void 0);
  plan.updatedBy = new Types39.ObjectId(actorId);
  await plan.save();
  return plan;
};
var deactivatePaymentPlan = async (planId, actorId) => {
  assertValidObjectId19(
    planId,
    "Payment plan ID"
  );
  const plan = await PaymentPlan.findById(
    planId
  );
  assertFound22(
    plan,
    "Payment plan not found",
    404
  );
  if (plan.status === "archived") {
    throwServiceError22(
      "Archived payment plan cannot be moved to draft",
      400
    );
  }
  plan.status = "draft";
  plan.isActive = false;
  plan.set("publishedAt", void 0);
  plan.updatedBy = new Types39.ObjectId(actorId);
  await plan.save();
  return plan;
};
var archivePaymentPlan = async (planId, actorId) => {
  assertValidObjectId19(
    planId,
    "Payment plan ID"
  );
  const plan = await PaymentPlan.findById(
    planId
  );
  assertFound22(
    plan,
    "Payment plan not found",
    404
  );
  plan.status = "archived";
  plan.isActive = false;
  plan.archivedAt = /* @__PURE__ */ new Date();
  plan.set("publishedAt", void 0);
  plan.updatedBy = new Types39.ObjectId(actorId);
  await plan.save();
  return plan;
};
var paymentPlanService = {
  createPaymentPlan,
  getAllPaymentPlans,
  getSinglePaymentPlan,
  getPaymentPlanBySlug,
  updatePaymentPlan,
  activatePaymentPlan,
  deactivatePaymentPlan,
  archivePaymentPlan
};

// src/modules/paymentPlans/payment.plan.controller.ts
var throwControllerError7 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var getAuthUser23 = (req) => {
  const user = req.user;
  if (!user) {
    return throwControllerError7("Authentication required", 401);
  }
  return {
    id: user.id,
    role: user.role
  };
};
var createPaymentPlan2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser23(req);
    const result = await paymentPlanService.createPaymentPlan(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Payment plan created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllPaymentPlans2 = async (req, res, next) => {
  try {
    const productType = typeof req.query.productType === "string" ? req.query.productType : void 0;
    const mode = typeof req.query.mode === "string" ? req.query.mode : void 0;
    const status = typeof req.query.status === "string" ? req.query.status : void 0;
    const result = await paymentPlanService.getAllPaymentPlans({
      productType,
      mode,
      status,
      includeArchived: req.query.includeArchived === "true"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment plans retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSinglePaymentPlan2 = async (req, res, next) => {
  try {
    const result = await paymentPlanService.getSinglePaymentPlan(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment plan retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getPaymentPlanBySlug2 = async (req, res, next) => {
  try {
    const result = await paymentPlanService.getPaymentPlanBySlug(
      String(req.params.slug)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment plan retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updatePaymentPlan2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser23(req);
    const result = await paymentPlanService.updatePaymentPlan(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment plan updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var activatePaymentPlan2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser23(req);
    const result = await paymentPlanService.activatePaymentPlan(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment plan activated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deactivatePaymentPlan2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser23(req);
    const result = await paymentPlanService.deactivatePaymentPlan(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment plan moved to draft successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var archivePaymentPlan2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser23(req);
    const result = await paymentPlanService.archivePaymentPlan(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Payment plan archived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var paymentPlanController = {
  createPaymentPlan: createPaymentPlan2,
  getAllPaymentPlans: getAllPaymentPlans2,
  getSinglePaymentPlan: getSinglePaymentPlan2,
  getPaymentPlanBySlug: getPaymentPlanBySlug2,
  updatePaymentPlan: updatePaymentPlan2,
  activatePaymentPlan: activatePaymentPlan2,
  deactivatePaymentPlan: deactivatePaymentPlan2,
  archivePaymentPlan: archivePaymentPlan2
};

// src/modules/paymentPlans/payment.plan.validation.ts
import { z as z28 } from "zod";
var mongoObjectIdSchema20 = z28.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid MongoDB ObjectId"
);
var slugSchema3 = z28.string().trim().min(2).max(200).regex(
  /^[a-z0-9]+(-[a-z0-9]+)*$/,
  "Slug must be lowercase, alphanumeric, and hyphen-separated"
);
var createPaymentPlanBodySchema = z28.object({
  name: z28.string().trim().min(2).max(200),
  slug: slugSchema3,
  description: z28.string().trim().max(2e3).optional(),
  productType: z28.enum(
    PAYMENT_PLAN_PRODUCT_TYPES
  ),
  product: mongoObjectIdSchema20.optional(),
  productRefModel: z28.enum(
    PAYMENT_PLAN_PRODUCT_REF_MODELS
  ).optional(),
  mode: z28.enum(
    PAYMENT_PLAN_MODES
  ),
  amountCents: z28.number().int().min(0),
  currency: z28.string().trim().length(3).optional(),
  interval: z28.enum(
    PAYMENT_PLAN_INTERVALS
  ).optional(),
  intervalCount: z28.number().int().min(1).optional(),
  stripeProductId: z28.string().trim().max(200).optional(),
  stripePriceId: z28.string().trim().max(200).optional(),
  order: z28.number().int().min(1).optional()
}).refine(
  (body) => body.product === void 0 && body.productRefModel === void 0 || body.product !== void 0 && body.productRefModel !== void 0,
  {
    message: "product and productRefModel must be provided together"
  }
);
var updatePaymentPlanBodySchema = z28.object({
  name: z28.string().trim().min(2).max(200).optional(),
  slug: slugSchema3.optional(),
  description: z28.string().trim().max(2e3).nullable().optional(),
  productType: z28.enum(
    PAYMENT_PLAN_PRODUCT_TYPES
  ).optional(),
  product: mongoObjectIdSchema20.nullable().optional(),
  productRefModel: z28.enum(
    PAYMENT_PLAN_PRODUCT_REF_MODELS
  ).nullable().optional(),
  mode: z28.enum(PAYMENT_PLAN_MODES).optional(),
  amountCents: z28.number().int().min(0).optional(),
  currency: z28.string().trim().length(3).optional(),
  interval: z28.enum(
    PAYMENT_PLAN_INTERVALS
  ).nullable().optional(),
  intervalCount: z28.number().int().min(1).nullable().optional(),
  stripeProductId: z28.string().trim().max(200).nullable().optional(),
  stripePriceId: z28.string().trim().max(200).nullable().optional(),
  order: z28.number().int().min(1).optional()
}).refine(
  (body) => Object.keys(body).length > 0,
  {
    message: "At least one field is required"
  }
);
var createPaymentPlanValidation = z28.object({
  body: createPaymentPlanBodySchema
});
var updatePaymentPlanValidation = z28.object({
  params: z28.object({
    id: mongoObjectIdSchema20
  }),
  body: updatePaymentPlanBodySchema
});
var paymentPlanIdValidation = z28.object({
  params: z28.object({
    id: mongoObjectIdSchema20
  })
});
var paymentPlanSlugValidation = z28.object({
  params: z28.object({
    slug: z28.string().trim().min(2).max(200)
  })
});

// src/modules/paymentPlans/payment.plan.route.ts
var router36 = Router36();
router36.post(
  "/",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    createPaymentPlanValidation
  ),
  paymentPlanController.createPaymentPlan
);
router36.get(
  "/",
  verifyToken,
  requireInvictusAccess,
  paymentPlanController.getAllPaymentPlans
);
router36.get(
  "/slug/:slug",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(
    paymentPlanSlugValidation
  ),
  paymentPlanController.getPaymentPlanBySlug
);
router36.get(
  "/:id",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(
    paymentPlanIdValidation
  ),
  paymentPlanController.getSinglePaymentPlan
);
router36.patch(
  "/:id",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    updatePaymentPlanValidation
  ),
  paymentPlanController.updatePaymentPlan
);
router36.patch(
  "/:id/activate",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    paymentPlanIdValidation
  ),
  paymentPlanController.activatePaymentPlan
);
router36.patch(
  "/:id/draft",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    paymentPlanIdValidation
  ),
  paymentPlanController.deactivatePaymentPlan
);
router36.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles(
    "admin",
    "manager"
  ),
  validateRequest_default(
    paymentPlanIdValidation
  ),
  paymentPlanController.archivePaymentPlan
);
var paymentPlanRoutes = router36;

// src/modules/invictus-payments/invictus.payment.route.ts
import { Router as Router37 } from "express";

// src/modules/invictus-payments/invictus.payment.controller.ts
var throwControllerError8 = (message, status) => {
  const error = new Error(
    message
  );
  error.status = status;
  throw error;
};
var getAuthUser24 = (req) => {
  const user = req.user;
  if (!user) {
    return throwControllerError8(
      "Authentication required",
      401
    );
  }
  return {
    id: user.id,
    fullName: user.fullName ?? "",
    email: user.email
  };
};
var createInvictusCheckoutSession2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser24(req);
    const result = await invictusPaymentService.createInvictusCheckoutSession(
      {
        userId: authUser.id,
        fullName: authUser.fullName,
        email: authUser.email,
        input: req.body
      }
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Checkout session created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyInvictusPurchases2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser24(req);
    const result = await invictusPaymentService.getMyInvictusPurchases(
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Your INVICTUS purchases retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var invictusPaymentController = {
  createInvictusCheckoutSession: createInvictusCheckoutSession2,
  getMyInvictusPurchases: getMyInvictusPurchases2
};

// src/modules/invictus-payments/invictus.payment.validation.ts
import { z as z29 } from "zod";
var mongoObjectIdSchema21 = z29.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid MongoDB ObjectId"
);
var createInvictusCheckoutValidation = z29.object({
  body: z29.object({
    paymentPlanId: mongoObjectIdSchema21,
    discountCode: z29.string().trim().optional()
  })
});

// src/modules/invictus-payments/invictus.payment.route.ts
var router37 = Router37();
router37.post(
  "/checkout",
  verifyToken,
  requireInvictusAccess,
  validateRequest_default(
    createInvictusCheckoutValidation
  ),
  invictusPaymentController.createInvictusCheckoutSession
);
router37.get(
  "/my-purchases",
  verifyToken,
  requireInvictusAccess,
  invictusPaymentController.getMyInvictusPurchases
);
var invictusPaymentRoutes = router37;

// src/modules/notifications/notification.route.ts
import { Router as Router38 } from "express";

// src/modules/notifications/notification.controller.ts
var getAuthUser25 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var parseBoolean2 = (value) => {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return void 0;
};
var parsePositiveNumber = (value) => {
  if (typeof value !== "string") {
    return void 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : void 0;
};
var buildMyQuery = (req) => {
  const query = {};
  const isRead = parseBoolean2(req.query.isRead);
  if (isRead !== void 0) {
    query.isRead = isRead;
  }
  if (typeof req.query.type === "string") {
    query.type = req.query.type;
  }
  if (typeof req.query.search === "string") {
    query.search = req.query.search;
  }
  const page = parsePositiveNumber(req.query.page);
  if (page !== void 0) {
    query.page = page;
  }
  const limit = parsePositiveNumber(req.query.limit);
  if (limit !== void 0) {
    query.limit = limit;
  }
  return query;
};
var getMyNotifications2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser25(req);
    const result = await notificationService.getMyNotifications(
      authUser.id,
      buildMyQuery(req)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Notifications retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyUnreadCount = async (req, res, next) => {
  try {
    const authUser = getAuthUser25(req);
    const result = await notificationService.getUnreadCount(authUser.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Unread notification count retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var markOneAsRead2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser25(req);
    const result = await notificationService.markOneAsRead(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Notification marked as read",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var markOneAsUnread2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser25(req);
    const result = await notificationService.markOneAsUnread(
      String(req.params.id),
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Notification marked as unread",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var markAllAsRead2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser25(req);
    const result = await notificationService.markAllAsRead(authUser.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All notifications marked as read",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var createManualNotification = async (req, res, next) => {
  try {
    const authUser = getAuthUser25(req);
    const payload = req.body;
    const result = await notificationService.createNotification({
      ...payload,
      actor: authUser.id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Notification created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var createFromTemplate = async (req, res, next) => {
  try {
    const authUser = getAuthUser25(req);
    const payload = req.body;
    const result = await notificationService.createNotificationFromTemplate({
      ...payload,
      actor: authUser.id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Notification created from template successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllNotificationsAdmin2 = async (req, res, next) => {
  try {
    getAuthUser25(req);
    const query = buildMyQuery(req);
    if (typeof req.query.recipientId === "string") {
      query.recipientId = req.query.recipientId;
    }
    if (typeof req.query.actorId === "string") {
      query.actorId = req.query.actorId;
    }
    const result = await notificationService.getAllNotificationsAdmin(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All notifications retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var notificationController = {
  getMyNotifications: getMyNotifications2,
  getMyUnreadCount,
  markOneAsRead: markOneAsRead2,
  markOneAsUnread: markOneAsUnread2,
  markAllAsRead: markAllAsRead2,
  createManualNotification,
  createFromTemplate,
  getAllNotificationsAdmin: getAllNotificationsAdmin2
};

// src/modules/notifications/notification.validation.ts
import { z as z30 } from "zod";
var mongoObjectIdSchema22 = z30.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var notificationTypeSchema = z30.string().trim().min(2).max(120).regex(
  /^[a-z0-9_.:-]+$/i,
  "Notification type may contain only letters, numbers, _, ., :, and -"
);
var metadataSchema = z30.record(z30.string(), z30.unknown());
var notificationIdValidation = z30.object({
  params: z30.object({
    id: mongoObjectIdSchema22
  })
});
var createNotificationValidation = z30.object({
  body: z30.object({
    recipient: mongoObjectIdSchema22,
    type: notificationTypeSchema,
    title: z30.string().trim().min(1).max(200),
    body: z30.string().trim().min(1).max(2e3),
    channels: z30.array(z30.enum(NOTIFICATION_CHANNELS)).min(1).optional(),
    relatedEntityType: z30.string().trim().min(1).max(120).optional(),
    relatedEntityId: mongoObjectIdSchema22.optional(),
    actionUrl: z30.string().trim().max(1e3).optional(),
    metadata: metadataSchema.optional(),
    dedupeKey: z30.string().trim().min(1).max(250).optional()
  })
});
var createNotificationFromTemplateValidation = z30.object({
  body: z30.object({
    recipient: mongoObjectIdSchema22,
    templateKey: z30.string().trim().min(2).max(120).regex(/^[a-z0-9_.:-]+$/i),
    variables: z30.record(
      z30.string(),
      z30.union([
        z30.string(),
        z30.number(),
        z30.boolean(),
        z30.null()
      ])
    ).optional(),
    channels: z30.array(z30.enum(NOTIFICATION_CHANNELS)).min(1).optional(),
    relatedEntityType: z30.string().trim().min(1).max(120).optional(),
    relatedEntityId: mongoObjectIdSchema22.optional(),
    actionUrl: z30.string().trim().max(1e3).optional(),
    metadata: metadataSchema.optional(),
    dedupeKey: z30.string().trim().min(1).max(250).optional()
  })
});
var getMyNotificationsValidation = z30.object({
  query: z30.object({
    isRead: z30.enum(["true", "false"]).optional(),
    type: notificationTypeSchema.optional(),
    search: z30.string().trim().max(200).optional(),
    page: z30.coerce.number().int().min(1).optional(),
    limit: z30.coerce.number().int().min(1).max(100).optional()
  })
});
var getAllNotificationsValidation = z30.object({
  query: z30.object({
    recipientId: mongoObjectIdSchema22.optional(),
    actorId: mongoObjectIdSchema22.optional(),
    isRead: z30.enum(["true", "false"]).optional(),
    type: notificationTypeSchema.optional(),
    search: z30.string().trim().max(200).optional(),
    page: z30.coerce.number().int().min(1).optional(),
    limit: z30.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/notifications/notification.route.ts
var router38 = Router38();
var ADMIN_ROLES = [
  "founder",
  "super_admin",
  "admin",
  "manager"
];
router38.get(
  "/me",
  verifyToken,
  validateRequest_default(getMyNotificationsValidation),
  notificationController.getMyNotifications
);
router38.get(
  "/me/unread-count",
  verifyToken,
  notificationController.getMyUnreadCount
);
router38.patch(
  "/me/read-all",
  verifyToken,
  notificationController.markAllAsRead
);
router38.patch(
  "/me/:id/read",
  verifyToken,
  validateRequest_default(notificationIdValidation),
  notificationController.markOneAsRead
);
router38.patch(
  "/me/:id/unread",
  verifyToken,
  validateRequest_default(notificationIdValidation),
  notificationController.markOneAsUnread
);
router38.post(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest_default(createNotificationValidation),
  notificationController.createManualNotification
);
router38.post(
  "/from-template",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest_default(createNotificationFromTemplateValidation),
  notificationController.createFromTemplate
);
router38.get(
  "/admin",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES),
  validateRequest_default(getAllNotificationsValidation),
  notificationController.getAllNotificationsAdmin
);
var notificationRoutes = router38;

// src/modules/notificationTemplates/notification.template.route.ts
import { Router as Router39 } from "express";

// src/modules/notificationTemplates/notification.template.service.ts
import { Types as Types40 } from "mongoose";
var assertValidObjectId20 = (value, fieldName) => {
  if (!Types40.ObjectId.isValid(value)) {
    throwServiceError_default(`${fieldName} is invalid`, 400);
  }
};
var TEMPLATE_POPULATE = [
  {
    path: "createdBy",
    select: "fullName email role profileImage"
  },
  {
    path: "updatedBy",
    select: "fullName email role profileImage"
  }
];
var createTemplate = async (payload, actorId) => {
  assertValidObjectId20(actorId, "Authenticated user ID");
  const key = payload.key.trim().toLowerCase();
  const existing = await NotificationTemplate.findOne({ key });
  if (existing) {
    throwServiceError_default(`Notification template key "${key}" already exists`, 409);
  }
  const template = await NotificationTemplate.create({
    key,
    titleTemplate: payload.titleTemplate,
    bodyTemplate: payload.bodyTemplate,
    channels: payload.channels ?? ["in_app"],
    ...payload.actionUrlTemplate !== void 0 ? { actionUrlTemplate: payload.actionUrlTemplate } : {},
    ...payload.description !== void 0 ? { description: payload.description } : {},
    enabled: payload.enabled ?? true,
    createdBy: new Types40.ObjectId(actorId),
    updatedBy: new Types40.ObjectId(actorId)
  });
  return template.populate(TEMPLATE_POPULATE);
};
var getTemplates = async (query = {}) => {
  const filter = {};
  if (query.enabled !== void 0) {
    filter.enabled = query.enabled;
  }
  if (query.channel) {
    filter.channels = query.channel;
  }
  if (query.search) {
    const regex = new RegExp(
      query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    filter.$or = [
      { key: regex },
      { titleTemplate: regex },
      { bodyTemplate: regex },
      { description: regex }
    ];
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    NotificationTemplate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(TEMPLATE_POPULATE),
    NotificationTemplate.countDocuments(filter)
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data
  };
};
var getSingleTemplate = async (templateId) => {
  assertValidObjectId20(templateId, "Notification template ID");
  const template = await NotificationTemplate.findById(templateId).populate(
    TEMPLATE_POPULATE
  );
  assertFound_default(template, "Notification template not found", 404);
  return template;
};
var updateTemplate = async (templateId, payload, actorId) => {
  assertValidObjectId20(templateId, "Notification template ID");
  assertValidObjectId20(actorId, "Authenticated user ID");
  const template = await NotificationTemplate.findById(templateId);
  assertFound_default(template, "Notification template not found", 404);
  if (payload.titleTemplate !== void 0) {
    template.titleTemplate = payload.titleTemplate;
  }
  if (payload.bodyTemplate !== void 0) {
    template.bodyTemplate = payload.bodyTemplate;
  }
  if (payload.channels !== void 0) {
    template.channels = payload.channels;
  }
  if (payload.actionUrlTemplate !== void 0) {
    if (payload.actionUrlTemplate === null) {
      template.actionUrlTemplate = void 0;
    } else {
      template.actionUrlTemplate = payload.actionUrlTemplate;
    }
  }
  if (payload.description !== void 0) {
    if (payload.description === null) {
      template.description = void 0;
    } else {
      template.description = payload.description;
    }
  }
  if (payload.enabled !== void 0) {
    template.enabled = payload.enabled;
  }
  template.updatedBy = new Types40.ObjectId(actorId);
  await template.save();
  return template.populate(TEMPLATE_POPULATE);
};
var getTemplateByKey = async (key) => {
  return NotificationTemplate.findOne({
    key: key.trim().toLowerCase()
  });
};
var notificationTemplateService = {
  createTemplate,
  getTemplates,
  getSingleTemplate,
  updateTemplate,
  getTemplateByKey
};

// src/modules/notificationTemplates/notification.template.controller.ts
var getAuthUser26 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var getTemplates2 = async (req, res, next) => {
  try {
    getAuthUser26(req);
    const query = {};
    if (req.query.enabled === "true") {
      query.enabled = true;
    }
    if (req.query.enabled === "false") {
      query.enabled = false;
    }
    if (typeof req.query.channel === "string") {
      query.channel = req.query.channel;
    }
    if (typeof req.query.search === "string") {
      query.search = req.query.search;
    }
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await notificationTemplateService.getTemplates(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Notification templates retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleTemplate2 = async (req, res, next) => {
  try {
    getAuthUser26(req);
    const result = await notificationTemplateService.getSingleTemplate(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Notification template retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var createTemplate2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser26(req);
    const result = await notificationTemplateService.createTemplate(
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Notification template created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateTemplate2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser26(req);
    const result = await notificationTemplateService.updateTemplate(
      String(req.params.id),
      req.body,
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Notification template updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var notificationTemplateController = {
  getTemplates: getTemplates2,
  getSingleTemplate: getSingleTemplate2,
  createTemplate: createTemplate2,
  updateTemplate: updateTemplate2
};

// src/modules/notificationTemplates/notification.template.validation.ts
import { z as z31 } from "zod";
var mongoObjectIdSchema23 = z31.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var templateKeySchema = z31.string().trim().min(2).max(120).regex(
  /^[a-z0-9_.:-]+$/,
  "Template key must use lowercase letters, numbers, _, ., :, or -"
);
var notificationTemplateIdValidation = z31.object({
  params: z31.object({
    id: mongoObjectIdSchema23
  })
});
var createNotificationTemplateValidation = z31.object({
  body: z31.object({
    key: templateKeySchema,
    titleTemplate: z31.string().trim().min(1).max(200),
    bodyTemplate: z31.string().trim().min(1).max(2e3),
    channels: z31.array(z31.enum(NOTIFICATION_CHANNELS)).min(1).optional(),
    actionUrlTemplate: z31.string().trim().max(1e3).optional(),
    description: z31.string().trim().max(1e3).optional(),
    enabled: z31.boolean().optional()
  })
});
var updateNotificationTemplateValidation = z31.object({
  params: z31.object({
    id: mongoObjectIdSchema23
  }),
  body: z31.object({
    titleTemplate: z31.string().trim().min(1).max(200).optional(),
    bodyTemplate: z31.string().trim().min(1).max(2e3).optional(),
    channels: z31.array(z31.enum(NOTIFICATION_CHANNELS)).min(1).optional(),
    actionUrlTemplate: z31.union([z31.string().trim().max(1e3), z31.null()]).optional(),
    description: z31.union([z31.string().trim().max(1e3), z31.null()]).optional(),
    enabled: z31.boolean().optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update"
  })
});
var getNotificationTemplatesValidation = z31.object({
  query: z31.object({
    enabled: z31.enum(["true", "false"]).optional(),
    channel: z31.enum(NOTIFICATION_CHANNELS).optional(),
    search: z31.string().trim().max(200).optional(),
    page: z31.coerce.number().int().min(1).optional(),
    limit: z31.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/notificationTemplates/notification.template.route.ts
var router39 = Router39();
var ADMIN_ROLES2 = [
  "founder",
  "super_admin",
  "admin",
  "manager"
];
router39.get(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES2),
  validateRequest_default(getNotificationTemplatesValidation),
  notificationTemplateController.getTemplates
);
router39.get(
  "/:id",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES2),
  validateRequest_default(notificationTemplateIdValidation),
  notificationTemplateController.getSingleTemplate
);
router39.post(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES2),
  validateRequest_default(createNotificationTemplateValidation),
  notificationTemplateController.createTemplate
);
router39.patch(
  "/:id",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES2),
  validateRequest_default(updateNotificationTemplateValidation),
  notificationTemplateController.updateTemplate
);
var notificationTemplateRoutes = router39;

// src/modules/entitlementLogs/entitlementlog.route.ts
import { Router as Router40 } from "express";

// src/modules/entitlementLogs/entitlementlog.controller.ts
var throwControllerError9 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var assertFound23 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwControllerError9(message, statusCode);
  }
};
var getAuthUser27 = (req) => {
  const user = req.user;
  assertFound23(user, "Authentication required", 401);
  return {
    id: user.id,
    role: user.role
  };
};
var createEntitlementLog2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser27(req);
    const result = await entitlementLogService.createEntitlementLog({
      ...req.body,
      actor: req.body.actor ?? authUser.id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Entitlement log created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllEntitlementLogs2 = async (req, res, next) => {
  try {
    const options2 = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    };
    if (typeof req.query.userId === "string") {
      options2.userId = req.query.userId;
    }
    if (typeof req.query.entitlementId === "string") {
      options2.entitlementId = req.query.entitlementId;
    }
    if (typeof req.query.pillarId === "string") {
      options2.pillarId = req.query.pillarId;
    }
    if (typeof req.query.action === "string") {
      options2.action = req.query.action;
    }
    if (typeof req.query.source === "string") {
      options2.source = req.query.source;
    }
    const result = await entitlementLogService.getAllEntitlementLogs(options2);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Entitlement logs retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyEntitlementLogs2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser27(req);
    const result = await entitlementLogService.getMyEntitlementLogs(
      authUser.id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Your entitlement logs retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleEntitlementLog2 = async (req, res, next) => {
  try {
    const result = await entitlementLogService.getSingleEntitlementLog(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Entitlement log retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var entitlementLogController = {
  createEntitlementLog: createEntitlementLog2,
  getAllEntitlementLogs: getAllEntitlementLogs2,
  getMyEntitlementLogs: getMyEntitlementLogs2,
  getSingleEntitlementLog: getSingleEntitlementLog2
};

// src/modules/entitlementLogs/entitlementlog.validaiton.ts
import { z as z32 } from "zod";
var mongoObjectIdSchema24 = z32.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var createEntitlementLogBodySchema = z32.object({
  user: mongoObjectIdSchema24,
  entitlement: mongoObjectIdSchema24,
  pillar: mongoObjectIdSchema24.optional(),
  paymentSession: mongoObjectIdSchema24.optional(),
  action: z32.enum(ENTITLEMENT_LOG_ACTIONS),
  source: z32.enum(ENTITLEMENT_LOG_SOURCES),
  reason: z32.string().trim().max(1e3).optional(),
  actor: mongoObjectIdSchema24.optional(),
  metadata: z32.record(z32.string(), z32.unknown()).optional()
});
var createEntitlementLogValidation = z32.object({
  body: createEntitlementLogBodySchema
});
var entitlementLogIdValidation = z32.object({
  params: z32.object({
    id: mongoObjectIdSchema24
  })
});
var getAllEntitlementLogsValidation = z32.object({
  query: z32.object({
    userId: mongoObjectIdSchema24.optional(),
    entitlementId: mongoObjectIdSchema24.optional(),
    pillarId: mongoObjectIdSchema24.optional(),
    action: z32.enum(ENTITLEMENT_LOG_ACTIONS).optional(),
    source: z32.enum(ENTITLEMENT_LOG_SOURCES).optional(),
    page: z32.coerce.number().int().min(1).optional(),
    limit: z32.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/entitlementLogs/entitlementlog.route.ts
var router40 = Router40();
router40.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(createEntitlementLogValidation),
  entitlementLogController.createEntitlementLog
);
router40.get(
  "/me",
  verifyToken,
  entitlementLogController.getMyEntitlementLogs
);
router40.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(getAllEntitlementLogsValidation),
  entitlementLogController.getAllEntitlementLogs
);
router40.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  validateRequest_default(entitlementLogIdValidation),
  entitlementLogController.getSingleEntitlementLog
);
var entitlementLogRoutes = router40;

// src/modules/activitylogs/activitylog.route.ts
import { Router as Router41 } from "express";

// src/modules/activitylogs/activitylog.controller.ts
var throwControllerError10 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var assertFound24 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwControllerError10(message, statusCode);
  }
};
var getAuthUser28 = (req) => {
  const user = req.user;
  assertFound24(user, "Authentication required", 401);
  return {
    id: user.id,
    role: user.role
  };
};
var createActivityLog2 = async (req, res, next) => {
  try {
    const authUser = getAuthUser28(req);
    const result = await activityLogService.createActivityLog({
      ...req.body,
      actor: req.body.actor ?? authUser.id,
      ipAddress: req.body.ipAddress ?? req.ip,
      userAgent: req.body.userAgent ?? req.headers["user-agent"]
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Activity log created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllActivityLogs2 = async (req, res, next) => {
  try {
    const options2 = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    };
    if (typeof req.query.actorId === "string") {
      options2.actorId = req.query.actorId;
    }
    if (typeof req.query.action === "string") {
      options2.action = req.query.action;
    }
    if (typeof req.query.targetEntityType === "string") {
      options2.targetEntityType = req.query.targetEntityType;
    }
    if (typeof req.query.targetEntityId === "string") {
      options2.targetEntityId = req.query.targetEntityId;
    }
    const result = await activityLogService.getAllActivityLogs(options2);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Activity logs retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleActivityLog2 = async (req, res, next) => {
  try {
    const result = await activityLogService.getSingleActivityLog(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Activity log retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var activityLogController = {
  createActivityLog: createActivityLog2,
  getAllActivityLogs: getAllActivityLogs2,
  getSingleActivityLog: getSingleActivityLog2
};

// src/modules/activitylogs/activitylog.validation.ts
import { z as z33 } from "zod";
var mongoObjectIdSchema25 = z33.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var createActivityLogBodySchema = z33.object({
  actor: mongoObjectIdSchema25.optional(),
  action: z33.enum(ACTIVITY_LOG_ACTIONS),
  targetEntityType: z33.enum(ACTIVITY_LOG_ENTITY_TYPES),
  targetEntityId: mongoObjectIdSchema25.optional(),
  changeSummary: z33.string().trim().max(1e3).optional(),
  changes: z33.record(z33.string(), z33.unknown()).optional(),
  ipAddress: z33.string().trim().optional(),
  userAgent: z33.string().trim().optional()
});
var createActivityLogValidation = z33.object({
  body: createActivityLogBodySchema
});
var activityLogIdValidation = z33.object({
  params: z33.object({
    id: mongoObjectIdSchema25
  })
});
var getAllActivityLogsValidation = z33.object({
  query: z33.object({
    actorId: mongoObjectIdSchema25.optional(),
    action: z33.enum(ACTIVITY_LOG_ACTIONS).optional(),
    targetEntityType: z33.enum(ACTIVITY_LOG_ENTITY_TYPES).optional(),
    targetEntityId: mongoObjectIdSchema25.optional(),
    page: z33.coerce.number().int().min(1).optional(),
    limit: z33.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/activitylogs/activitylog.route.ts
var router41 = Router41();
router41.post(
  "/",
  verifyToken,
  authorizeRoles("founder", "super_admin"),
  validateRequest_default(createActivityLogValidation),
  activityLogController.createActivityLog
);
router41.get(
  "/",
  verifyToken,
  authorizeRoles("manager", "founder", "super_admin"),
  validateRequest_default(getAllActivityLogsValidation),
  activityLogController.getAllActivityLogs
);
router41.get(
  "/:id",
  verifyToken,
  authorizeRoles("manager", "founder", "super_admin"),
  validateRequest_default(activityLogIdValidation),
  activityLogController.getSingleActivityLog
);
var activityLogRoutes = router41;

// src/modules/sessionSchedules/sessionschedules.route.ts
import { Router as Router42 } from "express";

// src/modules/sessionSchedules/sessionschedules.service.ts
import { Types as Types41 } from "mongoose";

// src/modules/sessionSchedules/sessionschedules.model.schema.ts
import { model as model39, Schema as Schema39 } from "mongoose";

// src/modules/sessionSchedules/sessionschedules.interface.ts
var SESSION_TYPES = [
  "academy_live",
  "mentorship_group",
  "retreat_prep",
  "community_call",
  "other"
];
var SESSION_STATUSES = [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
  "postponed"
];

// src/modules/sessionSchedules/sessionschedules.model.schema.ts
var sessionScheduleSchema = new Schema39(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2e3
    },
    sessionType: {
      type: String,
      enum: SESSION_TYPES,
      required: true,
      index: true
    },
    host: {
      type: Schema39.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    pillar: {
      type: Schema39.Types.ObjectId,
      ref: "ChallengePillar",
      index: true
    },
    courseModule: {
      type: Schema39.Types.ObjectId,
      ref: "CourseModule",
      index: true
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    timezone: {
      type: String,
      required: true,
      trim: true
    },
    meetingUrl: {
      type: String,
      trim: true
    },
    capacity: {
      type: Number,
      min: 1
    },
    status: {
      type: String,
      enum: SESSION_STATUSES,
      default: "scheduled",
      index: true
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    cancelledBy: {
      type: Schema39.Types.ObjectId,
      ref: "User"
    },
    cancelledAt: {
      type: Date
    },
    createdBy: {
      type: Schema39.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema39.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "sessionschedule"
  }
);
sessionScheduleSchema.pre("validate", function() {
  if (this.startTime && this.endTime && this.endTime.getTime() <= this.startTime.getTime()) {
    this.invalidate("endTime", "End time must be after start time");
  }
});
sessionScheduleSchema.index({
  host: 1,
  startTime: 1
});
sessionScheduleSchema.index({
  pillar: 1,
  startTime: 1
});
sessionScheduleSchema.index({
  status: 1,
  startTime: 1
});
var SessionSchedule = model39(
  "SessionSchedule",
  sessionScheduleSchema
);

// src/modules/sessionSchedules/sessionschedules.service.ts
var throwServiceError23 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound25 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError23(message, statusCode);
  }
};
var assertValidObjectId21 = (value, fieldName) => {
  if (!Types41.ObjectId.isValid(value)) {
    throwServiceError23(`${fieldName} is invalid`, 400);
  }
};
var safeLogActivityEvent2 = async (params) => {
  try {
    await activityLogService.createActivityLog({
      actor: params.actorId,
      action: params.action,
      targetEntityType: "SessionSchedule",
      targetEntityId: params.targetEntityId,
      ...params.changeSummary !== void 0 ? { changeSummary: params.changeSummary } : {}
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
};
var ensureHostExists = async (hostId) => {
  assertValidObjectId21(hostId, "Host ID");
  const host = await User.findById(hostId).select("_id fullName email role");
  assertFound25(host, "Host user not found", 404);
  return host;
};
var ensurePillarExists2 = async (pillarId) => {
  assertValidObjectId21(pillarId, "Pillar ID");
  const pillar = await ChallengePillar.findById(pillarId);
  assertFound25(pillar, "Challenge pillar not found", 404);
  return pillar;
};
var ensureCourseModuleExists6 = async (courseModuleId) => {
  assertValidObjectId21(courseModuleId, "Course module ID");
  const courseModule = await CourseModule.findById(courseModuleId);
  assertFound25(courseModule, "Course module not found", 404);
  return courseModule;
};
var assertNoHostConflict = async (params) => {
  const filter = {
    host: new Types41.ObjectId(params.hostId),
    status: { $nin: ["cancelled"] },
    startTime: { $lt: params.endTime },
    endTime: { $gt: params.startTime }
  };
  if (params.excludeSessionId) {
    filter._id = { $ne: new Types41.ObjectId(params.excludeSessionId) };
  }
  const conflictingSession = await SessionSchedule.findOne(filter);
  if (conflictingSession) {
    throwServiceError23(
      "This host already has a session scheduled during this time range",
      409
    );
  }
};
var populateSessionSchedule = (id3) => SessionSchedule.findById(id3).populate("host", "fullName email role").populate("pillar", "name slug title").populate("courseModule", "title slug").populate("createdBy", "fullName email role").populate("updatedBy", "fullName email role").populate("cancelledBy", "fullName email role");
var createSessionSchedule = async (payload, actorId) => {
  await ensureHostExists(payload.host);
  if (payload.pillar) {
    await ensurePillarExists2(payload.pillar);
  }
  if (payload.courseModule) {
    await ensureCourseModuleExists6(payload.courseModule);
  }
  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);
  if (endTime.getTime() <= startTime.getTime()) {
    throwServiceError23("End time must be after start time", 400);
  }
  await assertNoHostConflict({
    hostId: payload.host,
    startTime,
    endTime
  });
  const createData = {
    title: payload.title,
    sessionType: payload.sessionType,
    host: new Types41.ObjectId(payload.host),
    startTime,
    endTime,
    timezone: payload.timezone,
    createdBy: new Types41.ObjectId(actorId)
  };
  if (payload.description !== void 0) {
    createData.description = payload.description;
  }
  if (payload.pillar) {
    createData.pillar = new Types41.ObjectId(payload.pillar);
  }
  if (payload.courseModule) {
    createData.courseModule = new Types41.ObjectId(payload.courseModule);
  }
  if (payload.meetingUrl !== void 0) {
    createData.meetingUrl = payload.meetingUrl;
  }
  if (payload.capacity !== void 0) {
    createData.capacity = payload.capacity;
  }
  const session = await SessionSchedule.create(createData);
  await safeLogActivityEvent2({
    actorId,
    action: "create",
    targetEntityId: session._id.toString(),
    changeSummary: `Session "${payload.title}" scheduled`
  });
  const populated = await populateSessionSchedule(session._id);
  assertFound25(populated, "Session schedule not found after creation", 500);
  return populated;
};
var getAllSessionSchedules = async (options2) => {
  const page = options2.page ?? 1;
  const limit = options2.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (options2.hostId) {
    assertValidObjectId21(options2.hostId, "Host ID");
    filter.host = new Types41.ObjectId(options2.hostId);
  }
  if (options2.pillarId) {
    assertValidObjectId21(options2.pillarId, "Pillar ID");
    filter.pillar = new Types41.ObjectId(options2.pillarId);
  }
  if (options2.courseModuleId) {
    assertValidObjectId21(options2.courseModuleId, "Course module ID");
    filter.courseModule = new Types41.ObjectId(options2.courseModuleId);
  }
  if (options2.sessionType) {
    filter.sessionType = options2.sessionType;
  }
  if (options2.status) {
    filter.status = options2.status;
  }
  if (options2.startDate || options2.endDate) {
    filter.startTime = {};
    if (options2.startDate) {
      filter.startTime.$gte = new Date(
        options2.startDate
      );
    }
    if (options2.endDate) {
      filter.startTime.$lte = new Date(
        options2.endDate
      );
    }
  }
  const [data, total] = await Promise.all([
    SessionSchedule.find(filter).sort({
      startTime: 1
    }).skip(skip).limit(limit).populate("host", "fullName email role").populate("pillar", "name slug title").populate("courseModule", "title slug"),
    SessionSchedule.countDocuments(filter)
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getSingleSessionSchedule = async (sessionId) => {
  assertValidObjectId21(sessionId, "Session schedule ID");
  const session = await populateSessionSchedule(
    new Types41.ObjectId(sessionId)
  );
  assertFound25(session, "Session schedule not found", 404);
  return session;
};
var updateSessionSchedule = async (sessionId, payload, actorId) => {
  assertValidObjectId21(sessionId, "Session schedule ID");
  const session = await SessionSchedule.findById(sessionId);
  assertFound25(session, "Session schedule not found", 404);
  if (session.status === "cancelled") {
    throwServiceError23("Cannot update a cancelled session", 400);
  }
  if (payload.host) {
    await ensureHostExists(payload.host);
    session.host = new Types41.ObjectId(payload.host);
  }
  if (payload.pillar !== void 0) {
    if (payload.pillar === null) {
      session.set("pillar", void 0);
    } else {
      await ensurePillarExists2(payload.pillar);
      session.pillar = new Types41.ObjectId(payload.pillar);
    }
  }
  if (payload.courseModule !== void 0) {
    if (payload.courseModule === null) {
      session.set("courseModule", void 0);
    } else {
      await ensureCourseModuleExists6(payload.courseModule);
      session.courseModule = new Types41.ObjectId(payload.courseModule);
    }
  }
  const nextStartTime = payload.startTime ? new Date(payload.startTime) : session.startTime;
  const nextEndTime = payload.endTime ? new Date(payload.endTime) : session.endTime;
  if (nextEndTime.getTime() <= nextStartTime.getTime()) {
    throwServiceError23("End time must be after start time", 400);
  }
  if (payload.startTime || payload.endTime || payload.host) {
    await assertNoHostConflict({
      hostId: payload.host ?? session.host.toString(),
      startTime: nextStartTime,
      endTime: nextEndTime,
      excludeSessionId: sessionId
    });
  }
  session.startTime = nextStartTime;
  session.endTime = nextEndTime;
  if (payload.title !== void 0) {
    session.title = payload.title;
  }
  if (payload.description !== void 0) {
    session.description = payload.description;
  }
  if (payload.sessionType !== void 0) {
    session.sessionType = payload.sessionType;
  }
  if (payload.timezone !== void 0) {
    session.timezone = payload.timezone;
  }
  if (payload.meetingUrl !== void 0) {
    session.set(
      "meetingUrl",
      payload.meetingUrl === null ? void 0 : payload.meetingUrl
    );
  }
  if (payload.capacity !== void 0) {
    session.set(
      "capacity",
      payload.capacity === null ? void 0 : payload.capacity
    );
  }
  if (payload.status !== void 0) {
    session.status = payload.status;
  }
  session.updatedBy = new Types41.ObjectId(actorId);
  await session.save();
  await safeLogActivityEvent2({
    actorId,
    action: "update",
    targetEntityId: session._id.toString(),
    changeSummary: `Session "${session.title}" updated`
  });
  const populated = await populateSessionSchedule(session._id);
  assertFound25(populated, "Session schedule not found after update", 500);
  return populated;
};
var cancelSessionSchedule = async (sessionId, payload, actorId) => {
  assertValidObjectId21(sessionId, "Session schedule ID");
  const session = await SessionSchedule.findById(sessionId);
  assertFound25(session, "Session schedule not found", 404);
  if (session.status === "cancelled") {
    throwServiceError23("Session is already cancelled", 400);
  }
  if (session.status === "completed") {
    throwServiceError23("Cannot cancel a completed session", 400);
  }
  session.status = "cancelled";
  session.cancellationReason = payload.reason;
  session.cancelledBy = new Types41.ObjectId(actorId);
  session.cancelledAt = /* @__PURE__ */ new Date();
  session.updatedBy = new Types41.ObjectId(actorId);
  await session.save();
  await safeLogActivityEvent2({
    actorId,
    action: "update",
    targetEntityId: session._id.toString(),
    changeSummary: `Session "${session.title}" cancelled \u2014 ${payload.reason}`
  });
  const populated = await populateSessionSchedule(session._id);
  assertFound25(populated, "Session schedule not found after cancellation", 500);
  return populated;
};
var deleteSessionSchedule = async (sessionId, actorId) => {
  assertValidObjectId21(sessionId, "Session schedule ID");
  const session = await SessionSchedule.findById(sessionId);
  assertFound25(session, "Session schedule not found", 404);
  await SessionSchedule.findByIdAndDelete(sessionId);
  await safeLogActivityEvent2({
    actorId,
    action: "delete",
    targetEntityId: sessionId,
    changeSummary: `Session "${session.title}" deleted`
  });
  return {
    message: "Session schedule deleted successfully"
  };
};
var sessionScheduleService = {
  createSessionSchedule,
  getAllSessionSchedules,
  getSingleSessionSchedule,
  updateSessionSchedule,
  cancelSessionSchedule,
  deleteSessionSchedule
};

// src/modules/sessionSchedules/sessionschedules.controller.ts
var throwControllerError11 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var assertFound26 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwControllerError11(message, statusCode);
  }
};
var getAuthUserId3 = (req) => {
  const user = req.user;
  assertFound26(user, "Authentication required", 401);
  const id3 = user.id;
  assertFound26(id3, "Authentication required", 401);
  return id3;
};
var createSessionSchedule2 = async (req, res, next) => {
  try {
    const actorId = getAuthUserId3(req);
    const result = await sessionScheduleService.createSessionSchedule(
      req.body,
      actorId
    );
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Session scheduled successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllSessionSchedules2 = async (req, res, next) => {
  try {
    const options2 = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    };
    if (typeof req.query.hostId === "string") {
      options2.hostId = req.query.hostId;
    }
    if (typeof req.query.pillarId === "string") {
      options2.pillarId = req.query.pillarId;
    }
    if (typeof req.query.courseModuleId === "string") {
      options2.courseModuleId = req.query.courseModuleId;
    }
    if (typeof req.query.sessionType === "string") {
      options2.sessionType = req.query.sessionType;
    }
    if (typeof req.query.status === "string") {
      options2.status = req.query.status;
    }
    if (typeof req.query.startDate === "string") {
      options2.startDate = req.query.startDate;
    }
    if (typeof req.query.endDate === "string") {
      options2.endDate = req.query.endDate;
    }
    const result = await sessionScheduleService.getAllSessionSchedules(options2);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session schedules retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleSessionSchedule2 = async (req, res, next) => {
  try {
    const result = await sessionScheduleService.getSingleSessionSchedule(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateSessionSchedule2 = async (req, res, next) => {
  try {
    const actorId = getAuthUserId3(req);
    const result = await sessionScheduleService.updateSessionSchedule(
      String(req.params.id),
      req.body,
      actorId
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var cancelSessionSchedule2 = async (req, res, next) => {
  try {
    const actorId = getAuthUserId3(req);
    const result = await sessionScheduleService.cancelSessionSchedule(
      String(req.params.id),
      req.body,
      actorId
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule cancelled successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteSessionSchedule2 = async (req, res, next) => {
  try {
    const actorId = getAuthUserId3(req);
    const result = await sessionScheduleService.deleteSessionSchedule(
      String(req.params.id),
      actorId
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule deleted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var sessionScheduleController = {
  createSessionSchedule: createSessionSchedule2,
  getAllSessionSchedules: getAllSessionSchedules2,
  getSingleSessionSchedule: getSingleSessionSchedule2,
  updateSessionSchedule: updateSessionSchedule2,
  cancelSessionSchedule: cancelSessionSchedule2,
  deleteSessionSchedule: deleteSessionSchedule2
};

// src/modules/sessionSchedules/sessionschedules.validation.ts
import { z as z34 } from "zod";
var mongoObjectIdSchema26 = z34.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var isoDateTimeSchema = z34.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid date/time"
});
var createSessionScheduleBodySchema = z34.object({
  title: z34.string().trim().min(1).max(200),
  description: z34.string().trim().max(2e3).optional(),
  sessionType: z34.enum(SESSION_TYPES),
  host: mongoObjectIdSchema26,
  pillar: mongoObjectIdSchema26.optional(),
  courseModule: mongoObjectIdSchema26.optional(),
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  timezone: z34.string().trim().min(1),
  meetingUrl: z34.string().trim().url().optional(),
  capacity: z34.coerce.number().int().min(1).optional()
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"]
});
var createSessionScheduleValidation = z34.object({
  body: createSessionScheduleBodySchema
});
var updateSessionScheduleBodySchema = z34.object({
  title: z34.string().trim().min(1).max(200).optional(),
  description: z34.string().trim().max(2e3).optional(),
  sessionType: z34.enum(SESSION_TYPES).optional(),
  host: mongoObjectIdSchema26.optional(),
  pillar: mongoObjectIdSchema26.nullable().optional(),
  courseModule: mongoObjectIdSchema26.nullable().optional(),
  startTime: isoDateTimeSchema.optional(),
  endTime: isoDateTimeSchema.optional(),
  timezone: z34.string().trim().min(1).optional(),
  meetingUrl: z34.string().trim().url().nullable().optional(),
  capacity: z34.coerce.number().int().min(1).nullable().optional(),
  status: z34.enum(SESSION_STATUSES).optional()
}).refine(
  (data) => !(data.startTime && data.endTime) || new Date(data.endTime) > new Date(data.startTime),
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);
var updateSessionScheduleValidation = z34.object({
  params: z34.object({
    id: mongoObjectIdSchema26
  }),
  body: updateSessionScheduleBodySchema
});
var sessionScheduleIdValidation = z34.object({
  params: z34.object({
    id: mongoObjectIdSchema26
  })
});
var cancelSessionScheduleValidation = z34.object({
  params: z34.object({
    id: mongoObjectIdSchema26
  }),
  body: z34.object({
    reason: z34.string().trim().min(1).max(1e3)
  })
});
var getAllSessionSchedulesValidation = z34.object({
  query: z34.object({
    hostId: mongoObjectIdSchema26.optional(),
    pillarId: mongoObjectIdSchema26.optional(),
    courseModuleId: mongoObjectIdSchema26.optional(),
    sessionType: z34.enum(SESSION_TYPES).optional(),
    status: z34.enum(SESSION_STATUSES).optional(),
    startDate: isoDateTimeSchema.optional(),
    endDate: isoDateTimeSchema.optional(),
    page: z34.coerce.number().int().min(1).optional(),
    limit: z34.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/sessionSchedules/sessionschedules.route.ts
var router42 = Router42();
router42.post(
  "/",
  verifyToken,
  authorizeRoles("manager", "founder"),
  validateRequest_default(createSessionScheduleValidation),
  sessionScheduleController.createSessionSchedule
);
router42.get(
  "/",
  verifyToken,
  validateRequest_default(getAllSessionSchedulesValidation),
  sessionScheduleController.getAllSessionSchedules
);
router42.get(
  "/:id",
  verifyToken,
  validateRequest_default(sessionScheduleIdValidation),
  sessionScheduleController.getSingleSessionSchedule
);
router42.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest_default(updateSessionScheduleValidation),
  sessionScheduleController.updateSessionSchedule
);
router42.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("admin", "manager", "founder"),
  validateRequest_default(cancelSessionScheduleValidation),
  sessionScheduleController.cancelSessionSchedule
);
router42.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "founder"),
  validateRequest_default(sessionScheduleIdValidation),
  sessionScheduleController.deleteSessionSchedule
);
var sessionScheduleRoutes = router42;

// src/modules/sessionattendances/sessionattendances.route.ts
import { Router as Router43 } from "express";

// src/modules/sessionattendances/sessionattendances.service.ts
import { Types as Types42 } from "mongoose";

// src/modules/sessionattendances/sessionattendances.model.schema.ts
import { model as model40, Schema as Schema40 } from "mongoose";

// src/modules/sessionattendances/sessionattendances.interface.ts
var SESSION_ATTENDANCE_STATUSES = [
  "registered",
  "attended",
  "late",
  "no_show",
  "cancelled"
];

// src/modules/sessionattendances/sessionattendances.model.schema.ts
var sessionAttendanceSchema = new Schema40(
  {
    session: {
      type: Schema40.Types.ObjectId,
      ref: "SessionSchedule",
      required: true,
      index: true
    },
    user: {
      type: Schema40.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: SESSION_ATTENDANCE_STATUSES,
      default: "registered",
      index: true
    },
    registeredAt: {
      type: Date,
      default: () => /* @__PURE__ */ new Date()
    },
    joinedAt: {
      type: Date
    },
    leftAt: {
      type: Date
    },
    markedBy: {
      type: Schema40.Types.ObjectId,
      ref: "User"
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1e3
    },
    cancelledAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1e3
    }
  },
  {
    timestamps: true,
    collection: "sessionattendance"
  }
);
sessionAttendanceSchema.index(
  {
    session: 1,
    user: 1
  },
  {
    unique: true
  }
);
sessionAttendanceSchema.index({
  session: 1,
  status: 1
});
sessionAttendanceSchema.index({
  user: 1,
  status: 1
});
var SessionAttendance = model40(
  "SessionAttendance",
  sessionAttendanceSchema
);

// src/modules/sessionattendances/sessionattendances.service.ts
var throwServiceError24 = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
var assertFound27 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwServiceError24(message, statusCode);
  }
};
var assertValidObjectId22 = (value, fieldName) => {
  if (!Types42.ObjectId.isValid(value)) {
    throwServiceError24(`${fieldName} is invalid`, 400);
  }
};
var ensureSessionExists = async (sessionId) => {
  assertValidObjectId22(sessionId, "Session ID");
  const session = await SessionSchedule.findById(sessionId);
  assertFound27(session, "Session schedule not found", 404);
  return session;
};
var ensureUserExists4 = async (userId) => {
  assertValidObjectId22(userId, "User ID");
  const user = await User.findById(userId).select("_id fullName email role");
  assertFound27(user, "User not found", 404);
  return user;
};
var populateAttendance = (id3) => SessionAttendance.findById(id3).populate("session", "title sessionType startTime endTime status").populate("user", "fullName email role").populate("markedBy", "fullName email role");
var registerSessionAttendance = async (payload) => {
  await ensureSessionExists(payload.session);
  await ensureUserExists4(payload.user);
  const sessionObjectId = new Types42.ObjectId(payload.session);
  const userObjectId = new Types42.ObjectId(payload.user);
  const attendance = await SessionAttendance.findOneAndUpdate(
    {
      session: sessionObjectId,
      user: userObjectId
    },
    {
      $setOnInsert: {
        session: sessionObjectId,
        user: userObjectId,
        status: "registered",
        registeredAt: /* @__PURE__ */ new Date()
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
  const populated = await populateAttendance(attendance._id);
  assertFound27(populated, "Session attendance not found after registration", 500);
  return populated;
};
var markSessionAttendance = async (payload) => {
  await ensureSessionExists(payload.session);
  await ensureUserExists4(payload.user);
  const sessionObjectId = new Types42.ObjectId(payload.session);
  const userObjectId = new Types42.ObjectId(payload.user);
  const setData = {
    status: payload.status
  };
  if (payload.status === "attended" || payload.status === "late") {
    setData.joinedAt = /* @__PURE__ */ new Date();
  }
  if (payload.markedBy) {
    assertValidObjectId22(payload.markedBy, "Marked by ID");
    setData.markedBy = new Types42.ObjectId(payload.markedBy);
  }
  if (payload.notes !== void 0) {
    setData.notes = payload.notes;
  }
  const attendance = await SessionAttendance.findOneAndUpdate(
    {
      session: sessionObjectId,
      user: userObjectId
    },
    {
      $set: setData,
      $setOnInsert: {
        session: sessionObjectId,
        user: userObjectId,
        registeredAt: /* @__PURE__ */ new Date()
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
  const populated = await populateAttendance(attendance._id);
  assertFound27(populated, "Session attendance not found after marking", 500);
  return populated;
};
var cancelSessionAttendance = async (payload) => {
  assertValidObjectId22(payload.session, "Session ID");
  assertValidObjectId22(payload.user, "User ID");
  const attendance = await SessionAttendance.findOne({
    session: new Types42.ObjectId(payload.session),
    user: new Types42.ObjectId(payload.user)
  });
  assertFound27(attendance, "Session attendance record not found", 404);
  if (attendance.status === "cancelled") {
    const populated2 = await populateAttendance(attendance._id);
    assertFound27(populated2, "Session attendance not found", 404);
    return populated2;
  }
  attendance.status = "cancelled";
  attendance.cancellationReason = payload.reason;
  attendance.cancelledAt = /* @__PURE__ */ new Date();
  await attendance.save();
  const populated = await populateAttendance(attendance._id);
  assertFound27(populated, "Session attendance not found after cancellation", 500);
  return populated;
};
var getAllSessionAttendances = async (options2) => {
  const page = options2.page ?? 1;
  const limit = options2.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (options2.sessionId) {
    assertValidObjectId22(options2.sessionId, "Session ID");
    filter.session = new Types42.ObjectId(options2.sessionId);
  }
  if (options2.userId) {
    assertValidObjectId22(options2.userId, "User ID");
    filter.user = new Types42.ObjectId(options2.userId);
  }
  if (options2.status) {
    filter.status = options2.status;
  }
  const [data, total] = await Promise.all([
    SessionAttendance.find(filter).sort({
      createdAt: -1
    }).skip(skip).limit(limit).populate("session", "title sessionType startTime endTime status").populate("user", "fullName email role").populate("markedBy", "fullName email role"),
    SessionAttendance.countDocuments(filter)
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getMySessionAttendances = async (userId) => {
  assertValidObjectId22(userId, "User ID");
  const attendances = await SessionAttendance.find({
    user: new Types42.ObjectId(userId)
  }).sort({
    createdAt: -1
  }).populate("session", "title sessionType startTime endTime status");
  return attendances;
};
var getSingleSessionAttendance = async (attendanceId) => {
  assertValidObjectId22(attendanceId, "Session attendance ID");
  const attendance = await populateAttendance(
    new Types42.ObjectId(attendanceId)
  );
  assertFound27(attendance, "Session attendance not found", 404);
  return attendance;
};
var sessionAttendanceService = {
  registerSessionAttendance,
  markSessionAttendance,
  cancelSessionAttendance,
  getAllSessionAttendances,
  getMySessionAttendances,
  getSingleSessionAttendance
};

// src/modules/sessionattendances/sessionattendances.controller.ts
var throwControllerError12 = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
var assertFound28 = (value, message, statusCode) => {
  if (value === null || value === void 0) {
    throwControllerError12(message, statusCode);
  }
};
var getAuthUserId4 = (req) => {
  const user = req.user;
  assertFound28(user, "Authentication required", 401);
  const id3 = user.id;
  assertFound28(id3, "Authentication required", 401);
  return id3;
};
var registerSessionAttendance2 = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId4(req);
    const result = await sessionAttendanceService.registerSessionAttendance({
      session: req.body.session,
      user: req.body.user ?? authUserId
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Registered for session successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var markSessionAttendance2 = async (req, res, next) => {
  try {
    const actorId = getAuthUserId4(req);
    const result = await sessionAttendanceService.markSessionAttendance({
      ...req.body,
      markedBy: req.body.markedBy ?? actorId
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Attendance marked successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var cancelSessionAttendance2 = async (req, res, next) => {
  try {
    const result = await sessionAttendanceService.cancelSessionAttendance(
      req.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session attendance cancelled successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllSessionAttendances2 = async (req, res, next) => {
  try {
    const options2 = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    };
    if (typeof req.query.sessionId === "string") {
      options2.sessionId = req.query.sessionId;
    }
    if (typeof req.query.userId === "string") {
      options2.userId = req.query.userId;
    }
    if (typeof req.query.status === "string") {
      options2.status = req.query.status;
    }
    const result = await sessionAttendanceService.getAllSessionAttendances(options2);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session attendances retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMySessionAttendances2 = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId4(req);
    const result = await sessionAttendanceService.getMySessionAttendances(authUserId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Your session attendances retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleSessionAttendance2 = async (req, res, next) => {
  try {
    const result = await sessionAttendanceService.getSingleSessionAttendance(
      String(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Session attendance retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var sessionAttendanceController = {
  registerSessionAttendance: registerSessionAttendance2,
  markSessionAttendance: markSessionAttendance2,
  cancelSessionAttendance: cancelSessionAttendance2,
  getAllSessionAttendances: getAllSessionAttendances2,
  getMySessionAttendances: getMySessionAttendances2,
  getSingleSessionAttendance: getSingleSessionAttendance2
};

// src/modules/sessionattendances/sessionattendances.validation.ts
import { z as z35 } from "zod";
var mongoObjectIdSchema27 = z35.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var registerSessionAttendanceValidation = z35.object({
  body: z35.object({
    session: mongoObjectIdSchema27,
    user: mongoObjectIdSchema27.optional()
  })
});
var markSessionAttendanceValidation = z35.object({
  body: z35.object({
    session: mongoObjectIdSchema27,
    user: mongoObjectIdSchema27,
    status: z35.enum(SESSION_ATTENDANCE_STATUSES),
    notes: z35.string().trim().max(1e3).optional()
  })
});
var cancelSessionAttendanceValidation = z35.object({
  body: z35.object({
    session: mongoObjectIdSchema27,
    user: mongoObjectIdSchema27,
    reason: z35.string().trim().min(1).max(1e3)
  })
});
var sessionAttendanceIdValidation = z35.object({
  params: z35.object({
    id: mongoObjectIdSchema27
  })
});
var getAllSessionAttendancesValidation = z35.object({
  query: z35.object({
    sessionId: mongoObjectIdSchema27.optional(),
    userId: mongoObjectIdSchema27.optional(),
    status: z35.enum(SESSION_ATTENDANCE_STATUSES).optional(),
    page: z35.coerce.number().int().min(1).optional(),
    limit: z35.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/sessionattendances/sessionattendances.route.ts
var router43 = Router43();
router43.post(
  "/register",
  verifyToken,
  validateRequest_default(registerSessionAttendanceValidation),
  sessionAttendanceController.registerSessionAttendance
);
router43.post(
  "/mark",
  verifyToken,
  authorizeRoles("manager", "founder"),
  validateRequest_default(markSessionAttendanceValidation),
  sessionAttendanceController.markSessionAttendance
);
router43.post(
  "/cancel",
  verifyToken,
  authorizeRoles("manager", "founder"),
  validateRequest_default(cancelSessionAttendanceValidation),
  sessionAttendanceController.cancelSessionAttendance
);
router43.get(
  "/me",
  verifyToken,
  sessionAttendanceController.getMySessionAttendances
);
router43.get(
  "/",
  verifyToken,
  authorizeRoles("manager", "founder"),
  validateRequest_default(getAllSessionAttendancesValidation),
  sessionAttendanceController.getAllSessionAttendances
);
router43.get(
  "/:id",
  verifyToken,
  authorizeRoles("manager", "founder"),
  validateRequest_default(sessionAttendanceIdValidation),
  sessionAttendanceController.getSingleSessionAttendance
);
var sessionAttendanceRoutes = router43;

// src/modules/supportTickets/support.ticket.route.ts
import { Router as Router44 } from "express";

// src/modules/supportTickets/support.ticket.service.ts
import { Types as Types43 } from "mongoose";

// src/modules/supportTickets/support.ticket.model.schema.ts
import { model as model41, Schema as Schema41 } from "mongoose";

// src/modules/supportTickets/support.ticket.interface.ts
var SUPPORT_TICKET_CATEGORIES = [
  "general",
  "technical",
  "billing",
  "membership",
  "account"
];
var SUPPORT_TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];
var SUPPORT_TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

// src/modules/supportTickets/support.ticket.model.schema.ts
var supportTicketSchema = new Schema41(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true, trim: true },
    requester: { type: Schema41.Types.ObjectId, ref: "User", required: true, index: true },
    assignedTo: { type: Schema41.Types.ObjectId, ref: "User", index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5e3 },
    category: { type: String, enum: SUPPORT_TICKET_CATEGORIES, default: "general", required: true, index: true },
    priority: { type: String, enum: SUPPORT_TICKET_PRIORITIES, default: "medium", required: true, index: true },
    status: { type: String, enum: SUPPORT_TICKET_STATUSES, default: "open", required: true, index: true },
    adminResponse: { type: String, trim: true, maxlength: 5e3 },
    respondedAt: Date,
    resolvedAt: Date
  },
  { timestamps: true, collection: "supporttickets" }
);
supportTicketSchema.index({ requester: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
var SupportTicket = model41("SupportTicket", supportTicketSchema);

// src/modules/supportTickets/support.ticket.service.ts
var populate = [
  { path: "requester", select: "fullName email role" },
  { path: "assignedTo", select: "fullName email role" }
];
var ticketNumber = () => `TKT-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
var list = async (filter, query) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const [data, total] = await Promise.all([
    SupportTicket.find(filter).populate(populate).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    SupportTicket.countDocuments(filter)
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
var supportTicketService = {
  async create(requester, payload) {
    const user = await User.findById(requester).select("_id");
    assertFound_default(user, "Requester user not found", 404);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await SupportTicket.create({ ...payload, requester: new Types43.ObjectId(requester), ticketNumber: ticketNumber() });
      } catch (error) {
        if (error.code !== 11e3) throw error;
      }
    }
    throw new BadRequestError("Could not generate a unique ticket number");
  },
  myTickets(requester, query) {
    return list({ requester: new Types43.ObjectId(requester), ...queryFilters(query) }, query);
  },
  adminList(query) {
    return list(queryFilters(query), query);
  },
  async getById(id3, requester, isAdmin) {
    const filter = isAdmin ? { _id: id3 } : { _id: id3, requester };
    const ticket = await SupportTicket.findOne(filter).populate(populate);
    assertFound_default(ticket, "Support ticket not found", 404);
    return ticket;
  },
  async update(id3, adminId, payload) {
    if (payload.assignedTo) {
      const assignee = await User.findById(payload.assignedTo).select("_id");
      assertFound_default(assignee, "Assigned user not found", 404);
    }
    const update2 = { status: payload.status };
    if (payload.adminResponse !== void 0) {
      update2.adminResponse = payload.adminResponse;
      update2.respondedAt = /* @__PURE__ */ new Date();
    }
    if (payload.assignedTo) update2.assignedTo = new Types43.ObjectId(payload.assignedTo);
    if (payload.status === "resolved" || payload.status === "closed") update2.resolvedAt = /* @__PURE__ */ new Date();
    const ticket = await SupportTicket.findByIdAndUpdate(id3, update2, { new: true, runValidators: true }).populate(populate);
    assertFound_default(ticket, "Support ticket not found", 404);
    return ticket;
  }
};
var queryFilters = (query) => {
  const { page: _page, limit: _limit, ...filters } = query;
  return filters;
};

// src/modules/supportTickets/support.ticket.controller.ts
var auth = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return req.user;
};
var admins = ["founder", "super_admin", "admin", "manager"];
var create = async (req, res, next) => {
  try {
    const user = auth(req);
    const data = await supportTicketService.create(user.id, req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Support ticket created successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var mine = async (req, res, next) => {
  try {
    const user = auth(req);
    const data = await supportTicketService.myTickets(user.id, req.query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Support tickets retrieved successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var adminList = async (req, res, next) => {
  try {
    auth(req);
    const data = await supportTicketService.adminList(req.query);
    sendResponse_default(
      res,
      {
        statusCode: 200,
        success: true,
        message: "Support tickets retrieved successfully",
        data
      }
    );
  } catch (error) {
    next(error);
  }
};
var getById = async (req, res, next) => {
  try {
    const user = auth(req);
    const data = await supportTicketService.getById(String(req.params.id), user.id, admins.includes(user.role));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Support ticket retrieved successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var update = async (req, res, next) => {
  try {
    const user = auth(req);
    const data = await supportTicketService.update(String(req.params.id), user.id, req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Support ticket updated successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var supportTicketController = {
  create,
  mine,
  adminList,
  getById,
  update
};

// src/modules/supportTickets/support.ticket.validation.ts
import { z as z36 } from "zod";
var id = z36.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var createSupportTicketValidation = z36.object({
  body: z36.object({
    subject: z36.string().trim().min(3).max(200),
    message: z36.string().trim().min(5).max(5e3),
    category: z36.enum(SUPPORT_TICKET_CATEGORIES).default("general"),
    priority: z36.enum(SUPPORT_TICKET_PRIORITIES).default("medium")
  })
});
var supportTicketIdValidation = z36.object({ params: z36.object({ id }) });
var supportTicketListValidation = z36.object({
  query: z36.object({
    status: z36.enum(SUPPORT_TICKET_STATUSES).optional(),
    priority: z36.enum(SUPPORT_TICKET_PRIORITIES).optional(),
    category: z36.enum(SUPPORT_TICKET_CATEGORIES).optional(),
    page: z36.coerce.number().int().min(1).optional(),
    limit: z36.coerce.number().int().min(1).max(100).optional()
  })
});
var updateSupportTicketValidation = z36.object({
  params: z36.object({ id }),
  body: z36.object({
    status: z36.enum(SUPPORT_TICKET_STATUSES),
    adminResponse: z36.string().trim().max(5e3).optional(),
    assignedTo: id.optional()
  })
});

// src/modules/supportTickets/support.ticket.route.ts
var router44 = Router44();
var ADMIN_ROLES3 = ["founder", "super_admin", "admin", "manager"];
router44.get("/", (req, res, next) => {
  res.status(200).json({ message: "Support ticket creation endpoint" });
});
router44.post("/", verifyToken, validateRequest_default(createSupportTicketValidation), supportTicketController.create);
router44.get("/me", verifyToken, validateRequest_default(supportTicketListValidation), supportTicketController.mine);
router44.get("/admin", verifyToken, authorizeRoles(...ADMIN_ROLES3), validateRequest_default(supportTicketListValidation), supportTicketController.adminList);
router44.get("/:id", verifyToken, validateRequest_default(supportTicketIdValidation), supportTicketController.getById);
router44.patch("/:id", verifyToken, authorizeRoles(...ADMIN_ROLES3), validateRequest_default(updateSupportTicketValidation), supportTicketController.update);
var supportTicketRoutes = router44;

// src/modules/userDevices/user.device.route.ts
import { Router as Router45 } from "express";

// src/modules/userDevices/user.device.service.ts
import { Types as Types44 } from "mongoose";

// src/modules/userDevices/user.device.model.schema.ts
import { model as model42, Schema as Schema42 } from "mongoose";

// src/modules/userDevices/user.device.interface.ts
var DEVICE_PLATFORMS = ["ios", "android", "web", "windows", "macos", "linux"];

// src/modules/userDevices/user.device.model.schema.ts
var pushSubscriptionSchema = new Schema42(
  {
    endpoint: { type: String, trim: true, maxlength: 2e3 },
    p256dh: { type: String, select: false },
    auth: { type: String, select: false }
  },
  { _id: false }
);
var userDeviceSchema = new Schema42(
  {
    user: { type: Schema42.Types.ObjectId, ref: "User", required: true, index: true },
    deviceIdentifier: { type: String, required: true, trim: true, maxlength: 200, index: true },
    platform: { type: String, enum: DEVICE_PLATFORMS, required: true },
    deviceName: { type: String, trim: true, maxlength: 120 },
    appVersion: { type: String, trim: true, maxlength: 40 },
    pushSubscription: { type: pushSubscriptionSchema },
    isActive: { type: Boolean, default: true, required: true, index: true },
    lastActiveAt: { type: Date, default: Date.now, required: true },
    revokedAt: Date
  },
  { timestamps: true, collection: "userdevices" }
);
userDeviceSchema.index({ user: 1, deviceIdentifier: 1 }, { unique: true });
userDeviceSchema.index(
  { "pushSubscription.endpoint": 1 },
  { unique: true, sparse: true, partialFilterExpression: { isActive: true } }
);
var UserDevice = model42("UserDevice", userDeviceSchema);

// src/modules/userDevices/user.device.service.ts
var safeSelect = "_id deviceIdentifier platform deviceName appVersion isActive lastActiveAt revokedAt createdAt updatedAt";
var userDeviceService = {
  async register(userId, payload) {
    const device = await UserDevice.findOneAndUpdate(
      { user: new Types44.ObjectId(userId), deviceIdentifier: payload.deviceIdentifier },
      { ...payload, user: new Types44.ObjectId(userId), isActive: true, revokedAt: void 0, lastActiveAt: /* @__PURE__ */ new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    ).select(safeSelect);
    return device;
  },
  list(userId) {
    return UserDevice.find({ user: userId }).select(safeSelect).sort({ lastActiveAt: -1 });
  },
  async revoke(userId, id3) {
    const device = await UserDevice.findOneAndUpdate(
      { _id: id3, user: userId },
      { isActive: false, revokedAt: /* @__PURE__ */ new Date() },
      { new: true }
    ).select(safeSelect);
    assertFound_default(device, "Device not found", 404);
    return device;
  }
};

// src/modules/userDevices/user.device.controller.ts
var auth2 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return req.user;
};
var register = async (req, res, next) => {
  try {
    const user = auth2(req);
    const data = await userDeviceService.register(user.id, req.body);
    sendResponse_default(
      res,
      {
        statusCode: 200,
        success: true,
        message: "Device registered successfully",
        data
      }
    );
  } catch (error) {
    next(error);
  }
};
var list2 = async (req, res, next) => {
  try {
    const user = auth2(req);
    const data = await userDeviceService.list(user.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Devices retrieved successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var revoke = async (req, res, next) => {
  try {
    const user = auth2(req);
    const data = await userDeviceService.revoke(user.id, String(req.params.id));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Device revoked successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var userDeviceController = {
  register,
  list: list2,
  revoke
};

// src/modules/userDevices/user.device.validation.ts
import { z as z37 } from "zod";
var id2 = z37.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var registerUserDeviceValidation = z37.object({
  body: z37.object({
    deviceIdentifier: z37.string().trim().min(1).max(200),
    platform: z37.enum(DEVICE_PLATFORMS),
    deviceName: z37.string().trim().max(120).optional(),
    appVersion: z37.string().trim().max(40).optional(),
    pushSubscription: z37.object({
      endpoint: z37.string().url().max(2e3),
      p256dh: z37.string().min(1).max(500).optional(),
      auth: z37.string().min(1).max(500).optional()
    }).optional()
  })
});
var userDeviceIdValidation = z37.object({ params: z37.object({ id: id2 }) });

// src/modules/userDevices/user.device.route.ts
var router45 = Router45();
router45.post("/me", verifyToken, validateRequest_default(registerUserDeviceValidation), userDeviceController.register);
router45.get("/me", verifyToken, userDeviceController.list);
router45.patch("/me/:id/revoke", verifyToken, validateRequest_default(userDeviceIdValidation), userDeviceController.revoke);
var userDeviceRoutes = router45;

// src/modules/streakLogs/streaklog.route.ts
import { Router as Router46 } from "express";

// src/modules/streakLogs/streaklog.service.ts
import { Types as Types45 } from "mongoose";

// src/modules/streakLogs/streaklog.model.schema.ts
import { model as model43, Schema as Schema43 } from "mongoose";

// src/modules/streakLogs/streaklog.interface.ts
var STREAK_TIMEZONES = ["UTC", "Asia/Dhaka"];
var STREAK_ACTIVITY_TYPES = [
  "login",
  "module",
  "quiz",
  "session",
  "manual",
  "other"
];

// src/modules/streakLogs/streaklog.model.schema.ts
var streakLogSchema = new Schema43(
  {
    user: {
      type: Schema43.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    academyProfile: {
      type: Schema43.Types.ObjectId,
      ref: "AcademyProfile",
      index: true
    },
    activityDate: {
      type: Date,
      required: true,
      index: true
    },
    normalizedDate: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true
    },
    timezone: {
      type: String,
      enum: STREAK_TIMEZONES,
      default: "UTC",
      required: true,
      index: true
    },
    activityType: {
      type: String,
      enum: STREAK_ACTIVITY_TYPES,
      default: "manual",
      required: true,
      index: true
    },
    activityCount: {
      type: Number,
      default: 1,
      min: 1,
      required: true
    },
    currentStreakDays: {
      type: Number,
      default: 1,
      min: 0,
      required: true
    },
    longestStreakDays: {
      type: Number,
      default: 1,
      min: 0,
      required: true
    },
    lastActivityDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: "streaklog"
  }
);
streakLogSchema.index({ user: 1, activityDate: 1 }, { unique: true });
streakLogSchema.index({ user: 1, normalizedDate: 1 });
streakLogSchema.index({ academyProfile: 1, normalizedDate: 1 });
var StreakLog = model43("StreakLog", streakLogSchema);

// src/modules/streakLogs/streaklog.service.ts
var normalizeDateString = (input, timezone = "UTC") => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid activityDate");
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const formatted = formatter.format(date);
  const [year, month, day] = formatted.split("-");
  return `${year}-${month}-${day}`;
};
var getDateFromNormalized = (normalizedDate) => /* @__PURE__ */ new Date(`${normalizedDate}T00:00:00.000Z`);
var syncStreaksForUser = async (userId) => {
  const entries = await StreakLog.find({ user: new Types45.ObjectId(userId) }).sort({ normalizedDate: 1 }).lean();
  if (entries.length === 0) {
    return;
  }
  let currentStreakDays = 0;
  let longestStreakDays = 0;
  let previousDate = null;
  for (const entry of entries) {
    const currentDate = getDateFromNormalized(entry.normalizedDate);
    if (previousDate && currentDate.getTime() - previousDate.getTime() === 864e5) {
      currentStreakDays += 1;
    } else {
      currentStreakDays = 1;
    }
    longestStreakDays = Math.max(longestStreakDays, currentStreakDays);
    previousDate = currentDate;
    await StreakLog.findByIdAndUpdate(
      entry._id,
      {
        currentStreakDays,
        longestStreakDays,
        lastActivityDate: currentDate
      },
      { runValidators: true }
    );
  }
  await StreakLog.updateMany(
    { user: new Types45.ObjectId(userId) },
    {
      currentStreakDays,
      longestStreakDays,
      lastActivityDate: previousDate ?? void 0
    },
    { runValidators: true }
  );
};
var createStreakLog = async (payload) => {
  const user = await User.findById(payload.user).select("_id");
  assertFound_default(user, "User not found", 404);
  if (payload.academyProfile) {
    const academyProfile = await User.findById(payload.academyProfile).select("_id");
    assertFound_default(academyProfile, "Academy profile not found", 404);
  }
  const timezone = payload.timezone ?? "UTC";
  const normalizedDate = normalizeDateString(payload.activityDate, timezone);
  const activityDateValue = getDateFromNormalized(normalizedDate);
  const existing = await StreakLog.findOne({
    user: new Types45.ObjectId(payload.user),
    normalizedDate
  }).select("_id");
  if (existing) {
    throw new Error("A streak log already exists for this user and date");
  }
  const log = await StreakLog.create({
    user: new Types45.ObjectId(payload.user),
    academyProfile: payload.academyProfile ? new Types45.ObjectId(payload.academyProfile) : void 0,
    activityDate: activityDateValue,
    normalizedDate,
    timezone,
    activityType: payload.activityType ?? "manual",
    activityCount: payload.activityCount ?? 1,
    currentStreakDays: 1,
    longestStreakDays: 1,
    lastActivityDate: activityDateValue
  });
  await syncStreaksForUser(payload.user);
  return log;
};
var getStreakLogs = async (query) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (query.userId) {
    filter.user = new Types45.ObjectId(query.userId);
  }
  if (query.academyProfileId) {
    filter.academyProfile = new Types45.ObjectId(query.academyProfileId);
  }
  if (query.timezone) {
    filter.timezone = query.timezone;
  }
  if (query.fromDate || query.toDate) {
    filter.normalizedDate = {};
    if (query.fromDate) {
      filter.normalizedDate.$gte = query.fromDate;
    }
    if (query.toDate) {
      filter.normalizedDate.$lte = query.toDate;
    }
  }
  const [data, total] = await Promise.all([
    StreakLog.find(filter).populate("user", "fullName email role").populate("academyProfile", "fullName companyName").sort({ normalizedDate: -1 }).skip(skip).limit(limit),
    StreakLog.countDocuments(filter)
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getSingleStreakLog = async (streakLogId) => {
  const log = await StreakLog.findById(streakLogId).populate("user", "fullName email role").populate("academyProfile", "fullName companyName");
  assertFound_default(log, "Streak log not found", 404);
  return log;
};
var streakLogService = {
  createStreakLog,
  getStreakLogs,
  getSingleStreakLog,
  syncStreaksForUser
};

// src/modules/streakLogs/streaklog.controller.ts
var getAuthUser29 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createStreakLog2 = async (req, res, next) => {
  try {
    const auth3 = getAuthUser29(req);
    const payload = {
      ...req.body,
      user: req.body.user ?? auth3.id
    };
    const result = await streakLogService.createStreakLog(payload);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Streak log created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyStreakLogs = async (req, res, next) => {
  try {
    const auth3 = getAuthUser29(req);
    const query = {
      userId: auth3.id,
      page: typeof req.query.page === "string" ? Number(req.query.page) : void 0,
      limit: typeof req.query.limit === "string" ? Number(req.query.limit) : void 0
    };
    if (typeof req.query.fromDate === "string") {
      query.fromDate = req.query.fromDate;
    }
    if (typeof req.query.toDate === "string") {
      query.toDate = req.query.toDate;
    }
    const result = await streakLogService.getStreakLogs(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Streak logs retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getStreakLogs2 = async (req, res, next) => {
  try {
    getAuthUser29(req);
    const query = {};
    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }
    if (typeof req.query.academyProfileId === "string") {
      query.academyProfileId = req.query.academyProfileId;
    }
    if (typeof req.query.timezone === "string") {
      query.timezone = req.query.timezone;
    }
    if (typeof req.query.fromDate === "string") {
      query.fromDate = req.query.fromDate;
    }
    if (typeof req.query.toDate === "string") {
      query.toDate = req.query.toDate;
    }
    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }
    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }
    const result = await streakLogService.getStreakLogs(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Streak logs retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleStreakLog2 = async (req, res, next) => {
  try {
    getAuthUser29(req);
    const result = await streakLogService.getSingleStreakLog(String(req.params.id));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Streak log retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var streakLogController = {
  createStreakLog: createStreakLog2,
  getMyStreakLogs,
  getStreakLogs: getStreakLogs2,
  getSingleStreakLog: getSingleStreakLog2
};

// src/modules/streakLogs/streaklog.validation.ts
import { z as z38 } from "zod";
var mongoObjectIdSchema28 = z38.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var dateStringSchema = z38.union([
  z38.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  z38.string().datetime({ offset: true })
]).or(z38.date());
var streakLogIdValidation = z38.object({
  params: z38.object({
    id: mongoObjectIdSchema28
  })
});
var createStreakLogValidation = z38.object({
  body: z38.object({
    user: mongoObjectIdSchema28,
    academyProfile: mongoObjectIdSchema28.optional(),
    activityDate: dateStringSchema,
    timezone: z38.enum(STREAK_TIMEZONES).optional(),
    activityType: z38.enum(STREAK_ACTIVITY_TYPES).optional(),
    activityCount: z38.number().int().min(1).max(100).optional()
  })
});
var getStreakLogsValidation = z38.object({
  query: z38.object({
    userId: mongoObjectIdSchema28.optional(),
    academyProfileId: mongoObjectIdSchema28.optional(),
    timezone: z38.enum(STREAK_TIMEZONES).optional(),
    fromDate: z38.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    toDate: z38.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z38.coerce.number().int().min(1).optional(),
    limit: z38.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/streakLogs/streaklog.route.ts
var ADMIN_ROLES4 = ["founder", "super_admin", "admin", "manager"];
var router46 = Router46();
router46.post(
  "/",
  verifyToken,
  validateRequest_default(createStreakLogValidation),
  streakLogController.createStreakLog
);
router46.get(
  "/me",
  verifyToken,
  streakLogController.getMyStreakLogs
);
router46.get(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES4),
  validateRequest_default(getStreakLogsValidation),
  streakLogController.getStreakLogs
);
router46.get(
  "/:id",
  verifyToken,
  validateRequest_default(streakLogIdValidation),
  streakLogController.getSingleStreakLog
);
var streakLogRoutes = router46;

// src/modules/pointsLedger/pointsledger.route.ts
import { Router as Router47 } from "express";

// src/modules/pointsLedger/pointsledger.service.ts
import { Types as Types46 } from "mongoose";

// src/modules/pointsLedger/pointsledger.model.schema.ts
import { model as model44, Schema as Schema44 } from "mongoose";

// src/modules/pointsLedger/pointsledger.interface.ts
var POINTS_LEDGER_TYPES = [
  "credit",
  "debit",
  "adjustment",
  "reward",
  "penalty"
];
var POINTS_LEDGER_SOURCE_TYPES = [
  "module",
  "video",
  "quiz",
  "action",
  "session",
  "manual",
  "system",
  "other"
];
var POINTS_LEDGER_REASONS = [
  "module_completion",
  "video_completion",
  "quiz_pass",
  "action_complete",
  "session_attendance",
  "manual_adjustment",
  "system_reward",
  "penalty",
  "other"
];

// src/modules/pointsLedger/pointsledger.model.schema.ts
var pointsLedgerSchema = new Schema44(
  {
    user: {
      type: Schema44.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sourceType: {
      type: String,
      enum: POINTS_LEDGER_SOURCE_TYPES,
      index: true
    },
    sourceId: {
      type: Schema44.Types.ObjectId,
      index: true
    },
    sourceEntity: {
      type: String,
      trim: true,
      maxlength: 120,
      index: true
    },
    points: {
      type: Number,
      required: true,
      min: -1e6,
      max: 1e6
    },
    transactionType: {
      type: String,
      enum: POINTS_LEDGER_TYPES,
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: POINTS_LEDGER_REASONS,
      required: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    balanceAfter: {
      type: Number,
      min: -1e6,
      max: 1e6
    },
    balanceBefore: {
      type: Number,
      min: -1e6,
      max: 1e6
    },
    module: {
      type: Schema44.Types.ObjectId,
      ref: "CourseModule",
      index: true
    },
    video: {
      type: Schema44.Types.ObjectId,
      ref: "ModuleVideo",
      index: true
    },
    action: {
      type: Schema44.Types.ObjectId,
      ref: "ModuleAction",
      index: true
    },
    quiz: {
      type: Schema44.Types.ObjectId,
      ref: "QuizQuestion",
      index: true
    },
    session: {
      type: Schema44.Types.ObjectId,
      ref: "SessionSchedule",
      index: true
    },
    metadata: {
      type: Schema44.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: "pointsledger"
  }
);
pointsLedgerSchema.index(
  { user: 1, sourceType: 1, sourceId: 1, reason: 1 },
  { unique: true, sparse: true }
);
pointsLedgerSchema.index({ user: 1, createdAt: -1 });
pointsLedgerSchema.index({ sourceType: 1, sourceId: 1 });
var PointsLedger = model44("PointsLedger", pointsLedgerSchema);

// src/modules/pointsLedger/pointsledger.service.ts
var createPointsLedger = async (payload) => {
  const user = await User.findById(payload.user).select("_id");
  assertFound_default(user, "User not found", 404);
  const sourceFilter = payload.sourceType && payload.sourceId ? {
    user: new Types46.ObjectId(payload.user),
    sourceType: payload.sourceType,
    sourceId: new Types46.ObjectId(payload.sourceId),
    reason: payload.reason
  } : null;
  if (sourceFilter) {
    const duplicate = await PointsLedger.findOne(sourceFilter).select("_id");
    if (duplicate) {
      throw new Error("A points entry already exists for this user, source and reason");
    }
  }
  const entry = await PointsLedger.create({
    user: new Types46.ObjectId(payload.user),
    sourceType: payload.sourceType,
    sourceId: payload.sourceId ? new Types46.ObjectId(payload.sourceId) : void 0,
    sourceEntity: payload.sourceEntity,
    points: payload.points,
    transactionType: payload.transactionType,
    reason: payload.reason,
    description: payload.description,
    balanceAfter: payload.balanceAfter,
    balanceBefore: payload.balanceBefore,
    module: payload.module ? new Types46.ObjectId(payload.module) : void 0,
    video: payload.video ? new Types46.ObjectId(payload.video) : void 0,
    action: payload.action ? new Types46.ObjectId(payload.action) : void 0,
    quiz: payload.quiz ? new Types46.ObjectId(payload.quiz) : void 0,
    session: payload.session ? new Types46.ObjectId(payload.session) : void 0,
    metadata: payload.metadata ?? {}
  });
  return entry;
};
var getPointsLedger = async (query) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (query.userId) {
    filter.user = new Types46.ObjectId(query.userId);
  }
  if (query.sourceType) {
    filter.sourceType = query.sourceType;
  }
  if (query.sourceEntity) {
    filter.sourceEntity = query.sourceEntity;
  }
  if (query.reason) {
    filter.reason = query.reason;
  }
  if (query.transactionType) {
    filter.transactionType = query.transactionType;
  }
  const [data, total] = await Promise.all([
    PointsLedger.find(filter).populate("user", "fullName email role").sort({ createdAt: -1 }).skip(skip).limit(limit),
    PointsLedger.countDocuments(filter)
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getSinglePointsLedger = async (entryId) => {
  const entry = await PointsLedger.findById(entryId).populate("user", "fullName email role");
  assertFound_default(entry, "Points ledger entry not found", 404);
  return entry;
};
var pointsLedgerService = {
  createPointsLedger,
  getPointsLedger,
  getSinglePointsLedger
};

// src/modules/pointsLedger/pointsledger.controller.ts
var getAuthUser30 = (req) => {
  assertFound_default(req.user, "Authentication required", 401);
  return {
    id: req.user.id,
    role: req.user.role
  };
};
var createPointsLedger2 = async (req, res, next) => {
  try {
    getAuthUser30(req);
    const payload = req.body;
    const result = await pointsLedgerService.createPointsLedger(payload);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Points ledger entry created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getPointsLedger2 = async (req, res, next) => {
  try {
    getAuthUser30(req);
    const query = {};
    if (typeof req.query.userId === "string") query.userId = req.query.userId;
    if (typeof req.query.sourceType === "string") query.sourceType = req.query.sourceType;
    if (typeof req.query.sourceEntity === "string") query.sourceEntity = req.query.sourceEntity;
    if (typeof req.query.reason === "string") query.reason = req.query.reason;
    if (typeof req.query.transactionType === "string") query.transactionType = req.query.transactionType;
    if (typeof req.query.page === "string") query.page = Number(req.query.page);
    if (typeof req.query.limit === "string") query.limit = Number(req.query.limit);
    const result = await pointsLedgerService.getPointsLedger(query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Points ledger retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSinglePointsLedger2 = async (req, res, next) => {
  try {
    getAuthUser30(req);
    const result = await pointsLedgerService.getSinglePointsLedger(String(req.params.id));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Points ledger entry retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var pointsLedgerController = {
  createPointsLedger: createPointsLedger2,
  getPointsLedger: getPointsLedger2,
  getSinglePointsLedger: getSinglePointsLedger2
};

// src/modules/pointsLedger/pointsledger.validation.ts
import { z as z39 } from "zod";
var mongoObjectIdSchema29 = z39.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
var pointsLedgerIdValidation = z39.object({
  params: z39.object({
    id: mongoObjectIdSchema29
  })
});
var createPointsLedgerValidation = z39.object({
  body: z39.object({
    user: mongoObjectIdSchema29,
    sourceType: z39.enum(POINTS_LEDGER_SOURCE_TYPES).optional(),
    sourceId: mongoObjectIdSchema29.optional(),
    sourceEntity: z39.string().trim().max(120).optional(),
    points: z39.number().int().min(-1e6).max(1e6),
    transactionType: z39.enum(POINTS_LEDGER_TYPES),
    reason: z39.enum(POINTS_LEDGER_REASONS),
    description: z39.string().trim().max(500).optional(),
    balanceAfter: z39.number().int().min(-1e6).max(1e6).optional(),
    balanceBefore: z39.number().int().min(-1e6).max(1e6).optional(),
    module: mongoObjectIdSchema29.optional(),
    video: mongoObjectIdSchema29.optional(),
    action: mongoObjectIdSchema29.optional(),
    quiz: mongoObjectIdSchema29.optional(),
    session: mongoObjectIdSchema29.optional(),
    metadata: z39.record(z39.unknown()).optional()
  })
});
var getPointsLedgerValidation = z39.object({
  query: z39.object({
    userId: mongoObjectIdSchema29.optional(),
    sourceType: z39.enum(POINTS_LEDGER_SOURCE_TYPES).optional(),
    sourceEntity: z39.string().trim().max(120).optional(),
    reason: z39.enum(POINTS_LEDGER_REASONS).optional(),
    transactionType: z39.enum(POINTS_LEDGER_TYPES).optional(),
    page: z39.coerce.number().int().min(1).optional(),
    limit: z39.coerce.number().int().min(1).max(100).optional()
  })
});

// src/modules/pointsLedger/pointsledger.route.ts
var ADMIN_ROLES5 = ["founder", "super_admin", "admin", "manager"];
var router47 = Router47();
router47.post(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES5),
  validateRequest_default(createPointsLedgerValidation),
  pointsLedgerController.createPointsLedger
);
router47.get(
  "/",
  verifyToken,
  authorizeRoles(...ADMIN_ROLES5),
  validateRequest_default(getPointsLedgerValidation),
  pointsLedgerController.getPointsLedger
);
router47.get(
  "/:id",
  verifyToken,
  validateRequest_default(pointsLedgerIdValidation),
  pointsLedgerController.getSinglePointsLedger
);
var pointsLedgerRoutes = router47;

// src/routes/index.ts
var router48 = Router48();
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
  },
  {
    path: "/promoters",
    route: promoterRoutes
  },
  {
    path: "/dashboard",
    route: dashboardAnalyticsRoutes
  },
  {
    path: "/invictus/challenge-pillars",
    route: challengePillarRoutes
  },
  {
    path: "/invictus/course-modules",
    route: courseModuleRoutes
  },
  {
    path: "/invictus/module-videos",
    route: moduleVideoRoutes
  },
  {
    path: "/invictus/module-resources",
    route: moduleResourceRoutes
  },
  {
    path: "/invictus/quiz-questions",
    route: quizQuestionRoutes
  },
  {
    path: "/invictus/module-actions",
    route: moduleActionRoutes
  },
  {
    path: "/rooms",
    route: room_route_default
  },
  {
    path: "/messages",
    route: message_route_default
  },
  {
    path: "/logo",
    route: LogoRoutes
  },
  {
    path: "/invictus/academy-profile",
    route: academyProfileRoutes
  },
  {
    path: "/invictus/user-entitlements",
    route: userEntitlementRoutes
  },
  {
    path: "/invictus/video-progress",
    route: videoProgressRoutes
  },
  {
    path: "/invictus/module-progress",
    route: moduleProgressRoutes
  },
  {
    path: "/invictus/quiz-attempts",
    route: quizAttemptRoutes
  },
  {
    path: "/invictus/quiz-certificates",
    route: quizCertificateRoutes
  },
  {
    path: "/invictus/mentorship-profiles",
    route: mentorshipProfileRoutes
  },
  {
    path: "/invictus/mentorship-reviews",
    route: mentorshipReviewRoutes
  },
  {
    path: "/invictus",
    route: leaderboardEntryRoutes
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes
  },
  {
    path: "/invictus/course-modules",
    route: courseModuleRoutes
  },
  {
    path: "/invictus/module-videos",
    route: moduleVideoRoutes
  },
  {
    path: "/invictus/module-resources",
    route: moduleResourceRoutes
  },
  {
    path: "/invictus/quiz-questions",
    route: quizQuestionRoutes
  },
  {
    path: "/invictus/module-actions",
    route: moduleActionRoutes
  },
  {
    path: "/rooms",
    route: room_route_default
  },
  {
    path: "/messages",
    route: message_route_default
  },
  {
    path: "/logo",
    route: LogoRoutes
  },
  {
    path: "/invictus/academy-profile",
    route: academyProfileRoutes
  },
  {
    path: "/invictus/user-entitlements",
    route: userEntitlementRoutes
  },
  {
    path: "/invictus/video-progress",
    route: videoProgressRoutes
  },
  {
    path: "/invictus/module-progress",
    route: moduleProgressRoutes
  },
  {
    path: "/invictus/quiz-attempts",
    route: quizAttemptRoutes
  },
  {
    path: "/invictus/quiz-certificates",
    route: quizCertificateRoutes
  },
  {
    path: "/invictus/mentorship-profiles",
    route: mentorshipProfileRoutes
  },
  {
    path: "/invictus/mentor-bookings",
    route: mentorBookingRoutes
  },
  {
    path: "/invictus/retreat-locations",
    route: retreatLocationRoutes
  },
  {
    path: "/invictus/retreat-batches",
    route: retreatBatchRoutes
  },
  {
    path: "/invictus/retreat-bookings",
    route: retreatBookingRoutes
  },
  {
    path: "/invictus/payment-plans",
    route: paymentPlanRoutes
  },
  {
    path: "/invictus/payments",
    route: invictusPaymentRoutes
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardEntryRoutes
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes
  },
  {
    path: "/invictus/course-modules",
    route: courseModuleRoutes
  },
  {
    path: "/invictus/module-videos",
    route: moduleVideoRoutes
  },
  {
    path: "/invictus/module-resources",
    route: moduleResourceRoutes
  },
  {
    path: "/invictus/quiz-questions",
    route: quizQuestionRoutes
  },
  {
    path: "/invictus/module-actions",
    route: moduleActionRoutes
  },
  {
    path: "/rooms",
    route: room_route_default
  },
  {
    path: "/messages",
    route: message_route_default
  },
  {
    path: "/logo",
    route: LogoRoutes
  },
  {
    path: "/invictus/academy-profile",
    route: academyProfileRoutes
  },
  {
    path: "/invictus/user-entitlements",
    route: userEntitlementRoutes
  },
  {
    path: "/invictus/video-progress",
    route: videoProgressRoutes
  },
  {
    path: "/invictus/module-progress",
    route: moduleProgressRoutes
  },
  {
    path: "/invictus/quiz-attempts",
    route: quizAttemptRoutes
  },
  {
    path: "/invictus/quiz-certificates",
    route: quizCertificateRoutes
  },
  {
    path: "/invictus/mentorship-profiles",
    route: mentorshipProfileRoutes
  },
  {
    path: "/invictus/mentor-bookings",
    route: mentorBookingRoutes
  },
  {
    path: "/invictus/retreat-locations",
    route: retreatLocationRoutes
  },
  {
    path: "/invictus/retreat-batches",
    route: retreatBatchRoutes
  },
  {
    path: "/invictus/retreat-bookings",
    route: retreatBookingRoutes
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardEntryRoutes
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes
  },
  {
    path: "/invictus/notifications",
    route: notificationRoutes
  },
  {
    path: "/invictus/notification-templates",
    route: notificationTemplateRoutes
  },
  {
    path: "/invictus/entitlement-logs",
    route: entitlementLogRoutes
  },
  {
    path: "/invictus/activity-logs",
    route: activityLogRoutes
  },
  {
    path: "/invictus/session-schedules",
    route: sessionScheduleRoutes
  },
  {
    path: "/invictus/session-attendances",
    route: sessionAttendanceRoutes
  },
  {
    path: "/support-tickets",
    route: supportTicketRoutes
  },
  {
    path: "/user-devices",
    route: userDeviceRoutes
  },
  {
    path: "/invictus/streak-logs",
    route: streakLogRoutes
  },
  {
    path: "/invictus/points-ledger",
    route: pointsLedgerRoutes
  }
];
moduleRoutes.forEach((route) => {
  router48.use(route.path, route.route);
});
var routes_default = router48;

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
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
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
import http from "http";
var port = process.env.PORT || 3e3;
var main = async () => {
  try {
    await mongoose6.connect(config_default.MONGO_URI);
    const httpServer = http.createServer(app_default);
    initSocket(httpServer);
    httpServer.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};
main();
//# sourceMappingURL=server.js.map