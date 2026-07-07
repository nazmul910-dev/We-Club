import type { NextFunction, Request, Response } from "express";
import  jwt from "jsonwebtoken";
import config from "../config";
import { UserRole,USER_ROLES } from "../modules/users/user.interface";
import { UnauthorizedError, ForbiddenError } from "../utility/errorResponses";

interface JwtPayloadWithRole extends jwt.JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

console.log("authHeader:", authHeader);
console.log("token:", token);
console.log("secret:", config.JWT_ACCESS_SECRET);

  if (!token) {
    return next(new UnauthorizedError("Authentication token is required"));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET as jwt.Secret) as JwtPayloadWithRole;

    if (!decoded || !decoded.id || !decoded.role) {
      return next(new UnauthorizedError("Invalid token payload"));
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ensure verifyToken has already populated req.user
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

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

export default { verifyToken, authorizeRoles };