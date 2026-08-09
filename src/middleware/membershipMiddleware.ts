import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { User } from '../modules/users/users.model.schema';
import { syncMembershipExpiry } from '../utility/membership/membership.service';


export const requireActiveMembership = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new Error(
        'Authentication required'
      );
    }

    await syncMembershipExpiry(
      req.user.id as string
    );

    const user = await User.findById(
      req.user.id as string
    ).select(
      'membershipAccessStatus paymentStatus subscriptionStatus approvalStatus accountStatus'
    );

    if (!user) {
      throw new Error(
        'User not found'
      );
    }

    if (
      user.membershipAccessStatus ===
      'expired'
    ) {
      const error = new Error(
        'Your membership has expired. Please upgrade your plan to continue.'
      ) as Error & {
        statusCode?: number;
        code?: string;
      };

      error.statusCode = 403;

      error.code =
        'MEMBERSHIP_EXPIRED';

      throw error;
    }

    if (
      user.membershipAccessStatus !==
      'active'
    ) {
      const error = new Error(
        'Active membership required.'
      ) as Error & {
        statusCode?: number;
      };

      error.statusCode = 403;

      throw error;
    }

    next();
  } catch (error) {
    next(error);
  }
};