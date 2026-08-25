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

/**
 * এই middleware অবশ্যই verifyToken-এর পরে ব্যবহার করতে হবে।
 *
 * এটি শুধু INVICTUS Academy-এর overall platform access check করে।
 *
 * এটি FEARLESS / LIMITLESS / BORDERLESS purchase check করে না।
 * Pillar purchase check করার জন্য পরে আলাদা requirePillarAccess থাকবে।
 */
export const requireInvictusAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    /**
     * verifyToken আগে req.user তৈরি করবে।
     */
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

    /**
     * Admin এবং Manager Academy content manage করবে।
     * তাই তাদের membership/subscription check bypass করা হচ্ছে।
     */
    if (
      req.user.role === "founder" ||
      req.user.role === "manager"
    ) {
      return next();
    }

    /**
     * শুধু JWT payload-এর accessTo বিশ্বাস না করে
     * database থেকে latest user information নিচ্ছি।
     *
     * কারণ Admin পরে user suspend করতে পারে,
     * accessTo change করতে পারে অথবা subscription expire হতে পারে।
     */
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

    /**
     * User-এর membership package-এ
     * INVICTUS Academy আছে কিনা।
     */
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

    /**
     * Admin approval check।
     */
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

    /**
     * Account status check।
     */
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

    /**
     * Subscription status check।
     */
    if (
      user.subscriptionStatus !== "active"
    ) {
      return next(
        new ForbiddenError(
          "Your INVICTUS membership subscription is not active"
        )
      );
    }

    /**
     * Subscription expiry check।
     */
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

    /**
     * Database-এর fresh role/accessTo req.user-এ বসিয়ে দিচ্ছি।
     * পরের middleware/controller updated value পাবে।
     */
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