import { Types } from "mongoose";
import { sendDiscountCodeMail } from "../../utility/sendDiscountCodeMail";
import { AccessTo, UserRole } from "../users/user.interface";
import { DiscountCode, DiscountRedemption } from "./discount.model.schema";
import assertFound from "../../utility/assertFound";

type ValidateDiscountPayload = {
  code?: string | undefined;
  role?: UserRole | undefined;
  accessTo?: AccessTo | undefined;
  userId?: string | undefined;
};

type RedeemDiscountPayload = {
  code?: string | undefined;
  userId: string;
  role: UserRole;
  accessTo: AccessTo;
  stripeCheckoutSessionId: string;
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const MAX_REDEMPTIONS = 20;

const normalizeCode = (code: string): string => {
  return code.trim().toUpperCase();
};

const createDiscountCodeIntoDB = async (
  payload: {
    code: string;
    discountPercent: number;
    allowedRoles?: UserRole[] | undefined;
    allowedAccessTo?: AccessTo[] | undefined;
    maxRedemptionsPerRole?: number | undefined;
    expiresAt?: string | undefined;
    note?: string | undefined;
  },
  adminId?: string,
) => {
  const code = normalizeCode(payload.code);

  const existing = await DiscountCode.findOne({ code });

  if (existing) {
    throwError("Discount code already exists", 409);
  }

  const createPayload: Record<string, unknown> = {
    code,
    discountPercent: payload.discountPercent,

    maxRedemptions: 20,

    usedCount: 0,

    isActive: true,
  };

  if (payload.allowedRoles !== undefined) {
    createPayload.allowedRoles = payload.allowedRoles;
  }

  if (payload.allowedAccessTo !== undefined) {
    createPayload.allowedAccessTo = payload.allowedAccessTo;
  }

  if (payload.expiresAt !== undefined) {
    createPayload.expiresAt = new Date(payload.expiresAt);
  }

  if (payload.note !== undefined) {
    createPayload.note = payload.note;
  }

  if (adminId) {
    createPayload.createdBy = new Types.ObjectId(adminId);
  }

  return DiscountCode.create(createPayload);
};

const getAllDiscountCodesFromDB = async () => {
  return DiscountCode.find().sort({ createdAt: -1 });
};

const validateDiscountCodeForCheckout = async ({
  code,
  role,
  accessTo,
  userId,
}: ValidateDiscountPayload) => {
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
    code: normalizedCode,
  });

  if (!discountCode) {
    throwError("Invalid discount code", 400);
  }

  assertFound(discountCode,"Not found discount code",400)
  // Check expiry
  if (
    discountCode.expiresAt &&
    discountCode.expiresAt < new Date()
  ) {
    throwError("Discount code has expired", 400);
  }

  // Check allowed roles
  const allowedRoles = discountCode.allowedRoles ?? [];

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    throwError(
      "This discount code is not valid for this role",
      400,
    );
  }

  // Check allowed access
  const allowedAccessTo =
    discountCode.allowedAccessTo ?? [];

  if (
    allowedAccessTo.length > 0 &&
    !allowedAccessTo.includes(accessTo)
  ) {
    throwError(
      "This discount code is not valid for this access type",
      400,
    );
  }

  const usedCount = discountCode.usedCount ?? 0;

  // Maximum 20 successful users
  if (usedCount >= MAX_REDEMPTIONS) {
    // Make sure code is inactive
    if (discountCode.isActive) {
      await DiscountCode.findByIdAndUpdate(
        discountCode._id,
        {
          $set: {
            isActive: false,
          },
        },
      );
    }

    throwError(
      "This discount code has reached its usage limit",
      400,
    );
  }

  // If old/stale data made it inactive before 20 uses,
  // restore it because this project requires 20 uses.
  if (!discountCode.isActive && usedCount < MAX_REDEMPTIONS) {
    await DiscountCode.findByIdAndUpdate(
      discountCode._id,
      {
        $set: {
          isActive: true,
          maxRedemptions: MAX_REDEMPTIONS,
        },
      },
    );
  }

  // Same user cannot use same discount code twice
  if (userId) {
    const alreadyUsedByUser =
      await DiscountRedemption.findOne({
        discountCode: discountCode._id,
        user: new Types.ObjectId(userId),
      });

    if (alreadyUsedByUser) {
      throwError(
        "You have already used this discount code",
        400,
      );
    }
  }

  return {
    discountId: discountCode._id,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    usedCount,
    maxRedemptions: MAX_REDEMPTIONS,
  };
};

const redeemDiscountCodeAfterPayment = async ({
  code,
  userId,
  role,
  accessTo,
  stripeCheckoutSessionId,
}: RedeemDiscountPayload) => {
  if (!code) {
    return null;
  }

  const normalizedCode = normalizeCode(code);

  const discount = await DiscountCode.findOne({
    code: normalizedCode,
  });

  if (!discount) {
    return null;
  }

  const userObjectId = new Types.ObjectId(userId);


  const existingUserRedemption =
    await DiscountRedemption.findOne({
      discountCode: discount._id,
      user: userObjectId,
    });


  if (existingUserRedemption) {
    return existingUserRedemption;
  }

  console.log("user1;");
  const updatedDiscount =
    await DiscountCode.findOneAndUpdate(
      {
        _id: discount._id,
        $or: [
          { usedCount: { $lt: MAX_REDEMPTIONS } },
          { usedCount: { $exists: false } },
        ],
      },
      {
        $inc: {
          usedCount: 1,
        },

        $set: {
          maxRedemptions: MAX_REDEMPTIONS,
        },
      },
      {
        new: true,
      },
    );

  if (!updatedDiscount) {
    await DiscountCode.findByIdAndUpdate(
      discount._id,
      {
        $set: {
          isActive: false,
        },
      },
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
      redeemedAt: new Date(),
    });
  } catch (error: any) {

    await DiscountCode.findByIdAndUpdate(
      discount._id,
      {
        $inc: {
          usedCount: -1,
        },
      },
    );
    console.log("user3;")

    if (error?.code === 11000) {
      const existing =
        await DiscountRedemption.findOne({
          discountCode: discount._id,
          user: userObjectId,
        });
        console.log("user4");
      if (existing) {
        return existing;
      }
    }

    throw error;
  }


  const isNowExhausted =
    (updatedDiscount.usedCount ?? 0) >= MAX_REDEMPTIONS;

  await DiscountCode.findByIdAndUpdate(discount._id, {
    $set: {
      isActive: !isNowExhausted,
    },
  }).catch((err) => {
    console.error(
      "Failed to update isActive after successful redemption:",
      err,
    );
  });

  return redemption;
};

const sendDiscountCodeByEmail = async (email: string, code: string) => {
  const discount = await DiscountCode.findOne({
    code: normalizeCode(code),
    isActive: true,
  });

  if (!discount) {
    throwError("Discount code not found or inactive", 404);
  }

  const discountCode = discount as NonNullable<typeof discount>;

  await sendDiscountCodeMail({
    email,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    expiresAt: discountCode.expiresAt,
  });

  return {
    email,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    message: "Discount code email sent successfully",
  };
};

const deleteDiscountCodeFromDB = async (id: string) => {
  const discount = await DiscountCode.findById(id);

  if (!discount) {
    throwError("Discount code not found", 404);
  }

  await DiscountCode.findByIdAndDelete(id);

  return { deleted: true };
};

export const discountService = {
  createDiscountCodeIntoDB,
  getAllDiscountCodesFromDB,
  validateDiscountCodeForCheckout,
  redeemDiscountCodeAfterPayment,
  sendDiscountCodeByEmail,
  deleteDiscountCodeFromDB,
};
