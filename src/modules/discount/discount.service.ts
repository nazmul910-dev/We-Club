import { Types } from 'mongoose';
import { sendDiscountCodeMail } from '../../utility/sendDiscountCodeMail';
import { AccessTo, UserRole } from '../users/user.interface';
import {
  DiscountCode,
  DiscountRedemption,
} from './discount.model.schema';

type ValidateDiscountPayload = {
  code?: string | undefined;
  role?: UserRole | undefined;
  accessTo?: AccessTo | undefined;
  userId?: string | undefined;
};

type RedeemDiscountPayload = {
  code?: string | undefined;
  userId: string ;
  role: UserRole;
  accessTo: AccessTo;
  stripeCheckoutSessionId: string;
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

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
  adminId?: string
) => {
  const code = normalizeCode(payload.code);

  const existing = await DiscountCode.findOne({ code });

  if (existing) {
    throwError('Discount code already exists', 409);
  }

const createPayload: Record<string, unknown> = {
  code,
  discountPercent: payload.discountPercent,

  maxRedemptions: 1,

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

  if(!role){
    return null
  }

  if(!accessTo){
    return null
  }
  
  const normalizedCode = normalizeCode(code);

  const discount = await DiscountCode.findOne({
    code: normalizedCode,
  });

  if (!discount) {
    throwError('Invalid discount code', 400);
  }

  const discountCode = discount as NonNullable<typeof discount>;

  if (!discountCode.isActive) {
    throwError('Discount code is inactive', 400);
  }

  if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
    throwError('Discount code has expired', 400);
  }

  if (
    discountCode.allowedRoles &&
    discountCode.allowedRoles.length > 0 &&
    !discountCode.allowedRoles.includes(role)
  ) {
    throwError('This discount code is not valid for this role', 400);
  }

  if (
    discountCode.allowedAccessTo &&
    discountCode.allowedAccessTo.length > 0 &&
    !discountCode.allowedAccessTo.includes(accessTo)
  ) {
    throwError('This discount code is not valid for this access type', 400);
  }

if (
  (discountCode.usedCount ?? 0) >= 1
) {
  throwError(
    'This discount code has already been used',
    400
  );
}



  if (userId) {
    const alreadyUsedByUser = await DiscountRedemption.findOne({
      discountCode: discountCode._id,
      user: userId,
    });

    if (alreadyUsedByUser) {
      throwError('You have already used this discount code', 400);
    }
  }

  return {
    discountId: discountCode._id,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
  };
}; 

const redeemDiscountCodeAfterPayment =
async ({
  code,
  userId,
  role,
  accessTo,
  stripeCheckoutSessionId,
}: RedeemDiscountPayload ) => {
  if (!code) {
    return null;
  }

  const normalizedCode =
    normalizeCode(code);

  const discount =
    await DiscountCode.findOne({
      code:
        normalizedCode,
    });

  if (!discount) {
    return null;
  }

  if (
    (discount.usedCount ?? 0) >= 1
  ) {
    return null;
  }

  const existing =
    await DiscountRedemption
      .findOne({
        discountCode:
          discount._id,
      });

  if (existing) {
    return existing;
  }

  const redemption =
    await DiscountRedemption.create({
      discountCode:
        discount._id,

      code:
        discount.code,

      user:
        userId,

      role,

      accessTo,

      stripeCheckoutSessionId,

      redeemedAt:
        new Date(),
    });

  await DiscountCode
    .findByIdAndUpdate(
      discount._id,
      {
        $set: {
          isActive:
            false,
        },

        $inc: {
          usedCount:
            1,
        },
      }
    );

  return redemption;
};

const sendDiscountCodeByEmail = async (email: string, code: string) => {
  const discount = await DiscountCode.findOne({
    code: normalizeCode(code),
    isActive: true,
  });

  if (!discount) {
    throwError('Discount code not found or inactive', 404);
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
    message: 'Discount code email sent successfully',
  };
};

const deleteDiscountCodeFromDB = async (id: string) => {
  const discount = await DiscountCode.findById(id);

  if (!discount) {
    throwError('Discount code not found', 404);
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