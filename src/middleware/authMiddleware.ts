import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config";
import { Roles } from "../modules/users/user.interface";
import { UnauthorizedError, ForbiddenError } from "../utility/errorResponses";

interface JwtPayloadWithRole extends jwt.JwtPayload {
  id: string;
  email: string;
  role: Roles;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  if (!token) {
    return next(new UnauthorizedError("Authentication token is required"));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET as jwt.Secret) as JwtPayloadWithRole;

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

export const authorizeRoles = (...allowedRoles: Roles[]) => {
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