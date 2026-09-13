import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { User } from "../modules/users/users.model.schema";

import {
  UnauthorizedError,
  ForbiddenError,
} from "../utility/errorResponses";


export const requireInvictusAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
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

    if (
      req.user.role === "founder" ||
      req.user.role === "manager"
    ) {
      return next();
    }


    const user = await User.findById(userId)
      .select(
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
          "subscriptionExpiresAt",
        ].join(" ")
      )
      .lean();

    if (!user) {
      return next(
        new UnauthorizedError(
          "User account not found"
        )
      );
    }

    const hasInvictusAccess =
      user.accessTo === "invictus" ||
      user.accessTo === "both";

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


    if (
      user.accountStatus === "pending_payment"
    ) {
      return next(
        new ForbiddenError(
          "Please complete your membership payment first"
        )
      );
    }

    if (
      user.accountStatus === "pending_approval"
    ) {
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

    if (
      user.subscriptionStatus !== "active"
    ) {
      return next(
        new ForbiddenError(
          "Your INVICTUS membership subscription is not active"
        )
      );
    }


    if (
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) <=
        new Date()
    ) {
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
      accessTo: user.accessTo,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

export default requireInvictusAccess;