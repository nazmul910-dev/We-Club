
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/server.ts
import mongoose2 from "mongoose";

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
import { Router as Router3 } from "express";

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
import mongoose from "mongoose";
var userSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  role: {
    type: String,
    enum: ["ADMIN", "ASSOCIATES", "PARTNERS", "USER"],
    default: "USER"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
var User = mongoose.model("User", userSchema);
var users_model_schema_default = User;

// src/modules/users/auth.service.ts
var getAllUsersFromDB = async (query) => {
  const { limit, skip, sort, search } = query;
  const queryBuilder = new queryBuilder_default(users_model_schema_default.find().select("-password"), query).search(["name", "email"]).filter().sort().paginate();
  const users = await queryBuilder.modelQuery;
  return users;
};
var userService = { getAllUsersFromDB };

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
var userController = { getAllUsers };

// src/middleware/authMiddleware.ts
import * as jwt from "jsonwebtoken";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config_default = {
  MONGO_URI: process.env.MONGO_URI || "",
  DB_NAME: process.env.DB_NAME || "",
  JWT_SECRET: process.env.JWT_SECRET || "change_this_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h"
};

// src/utility/errorResponses.ts
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
var InvalidCredentialsError = class extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.statusCode = 401;
    this.name = "InvalidCredentialsError";
  }
};

// src/middleware/authMiddleware.ts
var verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) {
    return next(new UnauthorizedError("Authentication token is required"));
  }
  try {
    const decoded = jwt.verify(token, config_default.JWT_SECRET);
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
router.get("/", verifyToken, authorizeRoles("ADMIN", "MANAGER"), userController.getAllUsers);
var userRoutes = router;

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import * as jwt2 from "jsonwebtoken";
var SALT_ROUNDS = 10;
async function createUser(data) {
  console.log("Creating user with data:", data);
  if (!data.name || !data.email || !data.password) {
    throw new Error("name, email and password are required");
  }
  const existing = await users_model_schema_default.findOne({ email: data.email });
  if (existing) throw new ExistingUserError("User with this email already exists");
  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await users_model_schema_default.create({
    name: data.name,
    email: data.email,
    password: hashed,
    role: data.role || "USER"
  });
  const obj = user.toObject();
  delete obj.password;
  return obj;
}
async function loginUser(email, password) {
  const user = await users_model_schema_default.findOne({ email });
  if (!user) throw new InvalidCredentialsError("Invalid credentials");
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new InvalidCredentialsError("Invalid credentials");
  console.log(user);
  const payload = { id: user._id.toString(), email: user.email, role: user.role };
  const token = jwt2.sign(
    payload,
    config_default.JWT_SECRET,
    { expiresIn: config_default.JWT_EXPIRES_IN }
  );
  const u = user.toObject();
  delete u.password;
  return { token };
}

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
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User logged in successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var authController = { createUserInDB, loginUserInDB };

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/login", authController.loginUserInDB);
router2.post("/signup", authController.createUserInDB);
var authRoutes = router2;

// src/routes/index.ts
var router3 = Router3();
var moduleRoutes = [
  {
    path: "/users",
    route: userRoutes
  },
  {
    path: "/auth",
    route: authRoutes
  }
  // {
  // another route loading here
  // }
];
moduleRoutes.forEach((route) => {
  router3.use(route.path, route.route);
});
var routes_default = router3;

// src/app.ts
var app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello World");
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