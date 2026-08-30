import { QueryFilter, Types } from "mongoose";
import Stripe from "stripe";

import config from "../../config";
import { User } from "../users/users.model.schema";
import { RetreatBatch } from "../retreatBatches/retreat.batch.model.schema";
import { RetreatLocation } from "../retreatLocations/retreat.location.model.schema";
import { notificationService } from "../notifications/notification.service";

import {
  ICancelRetreatBooking,
  IConfirmRetreatBookingAdmin,
  ICreateRetreatBooking,
  IInviteRetreatBooking,
  IRefundRetreatBooking,
  IRetreatBooking,
  IRetreatBookingQuery,
  IUpdateRetreatBooking,
} from "./retreat.booking.interface";
import { RetreatBooking } from "./retreat.booking.model.schema";

const stripeSecretKey = config.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const getStripeClient = (): Stripe => {
  if (!stripe) {
    throwServiceError("Stripe is not configured. Please set STRIPE_SECRET_KEY.", 500);
  }
  return stripe as Stripe;
};

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
};

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const BOOKING_POPULATE = [
  {
    path: "user",
    select: "fullName email role profileImage phone city country",
  },
  {
    path: "retreatBatch",
    select: "batchName slug startDate endDate capacity confirmedBookingsCount waitlistCount price depositAmount currency status isFeatured",
    populate: {
      path: "retreatLocation",
      model: "RetreatLocation",
      select: "title slug country city coverImage tagline",
    },
  },
  {
    path: "retreatLocation",
    select: "title slug country city coverImage tagline whatsIncluded",
  },
  {
    path: "createdBy",
    select: "fullName email role",
  },
  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

const createRetreatBooking = async (
  payload: ICreateRetreatBooking,
  userId: string,
  actorId: string,
) => {
  assertValidObjectId(payload.retreatBatch, "Retreat batch ID");
  assertValidObjectId(userId, "User ID");

  const user = await User.findById(userId).select("_id fullName email role");
  assertFound(user, "User account not found", 404);

  const batch = await RetreatBatch.findById(payload.retreatBatch).populate({
    path: "retreatLocation",
    select: "_id title slug country city",
  });
  assertFound(batch, "Retreat batch not found", 404);

  if (batch.status === "cancelled" || batch.status === "completed") {
    throwServiceError(`Cannot join a retreat batch that is ${batch.status}`, 400);
  }

  // Prevent duplicate active booking for the same user and batch
  const activeExistingBooking = await RetreatBooking.findOne({
    user: new Types.ObjectId(userId),
    retreatBatch: batch._id,
    status: { $in: ["waitlisted", "invited", "payment_pending", "confirmed"] },
  });

  if (activeExistingBooking) {
    throwServiceError(
      `You already have an active booking (${activeExistingBooking.status}) for this retreat batch`,
      409,
    );
  }

  const locationId = (batch.retreatLocation as unknown as { _id: Types.ObjectId })._id;

  const createData: Record<string, unknown> = {
    user: user._id,
    retreatBatch: batch._id,
    retreatLocation: locationId,
    status: "waitlisted",
    amount: batch.price,
    currency: batch.currency,
    createdBy: new Types.ObjectId(actorId),
  };

  if (payload.notes !== undefined) {
    createData.notes = payload.notes;
  }

  if (payload.specialRequests !== undefined) {
    createData.specialRequests = payload.specialRequests;
  }

  if (payload.dietaryRequirements !== undefined) {
    createData.dietaryRequirements = payload.dietaryRequirements;
  }

  if (payload.emergencyContact !== undefined) {
    createData.emergencyContact = payload.emergencyContact;
  }

  const booking = await RetreatBooking.create(createData);

  // Increment waitlist count on batch
  await RetreatBatch.findByIdAndUpdate(batch._id, {
    $inc: { waitlistCount: 1 },
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
      batchName: batch.batchName,
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: createdBookingId,
    metadata: {
      status: booking.status,
      batchId: String(batch._id),
    },
    dedupeKey: `retreat_booking_waitlisted:${createdBookingId}`,
  });

  return booking.populate(BOOKING_POPULATE);
};

const createRetreatBookingCheckoutSession = async ({
  bookingId,
  userId,
  successUrl,
  cancelUrl,
}: {
  bookingId: string;
  userId: string;
  successUrl?: string | undefined;
  cancelUrl?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Retreat booking ID");
  assertValidObjectId(userId, "User ID");

  const booking = await RetreatBooking.findById(bookingId).populate([
    {
      path: "user",
      select: "_id fullName email",
    },
    {
      path: "retreatBatch",
      select: "_id batchName price currency capacity confirmedBookingsCount status",
      populate: {
        path: "retreatLocation",
        model: "RetreatLocation",
        select: "title city country",
      },
    },
  ]);

  assertFound(booking, "Retreat booking not found", 404);

  if (String(booking.user._id) !== userId) {
    throwServiceError("You are not authorized to pay for this booking", 403);
  }

  if (booking.status === "confirmed") {
    throwServiceError("This retreat booking is already confirmed and paid", 400);
  }

  if (booking.status === "cancelled" || booking.status === "refunded") {
    throwServiceError(`Cannot pay for a ${booking.status} retreat booking`, 400);
  }

  const batch = booking.retreatBatch as unknown as {
    _id: Types.ObjectId;
    batchName: string;
    price: number;
    currency: string;
    capacity: number;
    confirmedBookingsCount: number;
    status: string;
    retreatLocation?: { title?: string; city?: string; country?: string };
  };

  // Prevent overbooking
  if (batch.confirmedBookingsCount >= batch.capacity) {
    throwServiceError(
      "All confirmed seats for this retreat batch are currently sold out",
      409,
    );
  }

  const stripeClient = getStripeClient();
  const user = booking.user as unknown as { _id: Types.ObjectId; fullName: string; email: string };

  const defaultSuccessUrl = `${config.FRONTEND_URL || "http://localhost:5173"}/invictus/retreats/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`;
  const defaultCancelUrl = `${config.FRONTEND_URL || "http://localhost:5173"}/invictus/retreats/payment-cancelled?booking_id=${booking._id}`;

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    client_reference_id: booking._id.toString(),
    metadata: {
      purpose: "retreat_booking",
      bookingId: booking._id.toString(),
      batchId: batch._id.toString(),
      userId: user._id.toString(),
    },
    line_items: [
      {
        price_data: {
          currency: batch.currency || "usd",
          product_data: {
            name: `INVICTUS Retreat: ${batch.batchName}`,
            description: batch.retreatLocation
              ? `Private Luxury Retreat in ${batch.retreatLocation.city}, ${batch.retreatLocation.country}`
              : "INVICTUS Private Retreat Experience",
          },
          unit_amount: Math.round(batch.price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: successUrl || defaultSuccessUrl,
    cancel_url: cancelUrl || defaultCancelUrl,
  });

  booking.stripeCheckoutSessionId = session.id;
  booking.checkoutUrl = session.url ?? undefined;
  booking.status = "payment_pending";
  booking.updatedBy = new Types.ObjectId(userId);
  await booking.save();

  return {
    bookingId: booking._id,
    stripeCheckoutSessionId: session.id,
    checkoutUrl: session.url,
  };
};

const verifyRetreatBookingPayment = async (sessionId: string) => {
  if (!sessionId || !sessionId.trim()) {
    throwServiceError("Stripe checkout session ID is required", 400);
  }

  const stripeClient = getStripeClient();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return {
      paid: false,
      message: "Payment has not been completed on Stripe",
    };
  }

  const bookingId = session.metadata?.bookingId || session.client_reference_id;
  if (!bookingId) {
    throwServiceError("Booking ID missing from Stripe checkout metadata", 400);
  }

  const booking = await RetreatBooking.findById(bookingId);
  assertFound(booking, "Retreat booking not found", 404);

  if (booking.status === "confirmed") {
    return {
      paid: true,
      message: "Retreat booking is already confirmed",
      booking: await booking.populate(BOOKING_POPULATE),
    };
  }

  const previousStatus = booking.status;

  const existingBatch = await RetreatBatch.findById(booking.retreatBatch);
  assertFound(existingBatch, "Retreat batch not found", 404);

  if (existingBatch.confirmedBookingsCount >= existingBatch.capacity) {
    throwServiceError("Capacity exceeded. This retreat batch is completely full.", 409);
  }

  // Atomically increment confirmed bookings count on batch while checking capacity
  const batch = await RetreatBatch.findOneAndUpdate(
    {
      _id: existingBatch._id,
      confirmedBookingsCount: { $lt: existingBatch.capacity },
    },
    {
      $inc: {
        confirmedBookingsCount: 1,
        ...(previousStatus === "waitlisted" ? { waitlistCount: -1 } : {}),
      },
    },
    { new: true },
  );

  if (!batch) {
    throwServiceError(
      "Capacity exceeded. This retreat batch is completely full.",
      409,
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
  booking.paidAt = new Date();
  booking.confirmedAt = new Date();
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
      currency: booking.currency,
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: paidBookingId,
    metadata: {
      status: booking.status,
      paymentStatus: "paid",
      amountPaid: paidAmount,
    },
    dedupeKey: `retreat_booking_confirmed:${paidBookingId}`,
  });

  console.log("this is booking updated", booking);


  return {
    paid: true,
    message: "Retreat booking confirmed and payment verified successfully",
    booking: await booking.populate(BOOKING_POPULATE),
  };
};

const inviteRetreatBooking = async (
  bookingId: string,
  payload: IInviteRetreatBooking,
  actorId: string,
) => {
  assertValidObjectId(bookingId, "Retreat booking ID");

  const booking = await RetreatBooking.findById(bookingId);
  assertFound(booking, "Retreat booking not found", 404);

  if (booking.status === "confirmed") {
    throwServiceError("Cannot invite a member whose booking is already confirmed", 400);
  }

  const hours = payload.invitationExpiresInHours ?? 72;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const previousStatus = booking.status;

  booking.status = "invited";
  booking.invitationExpiresAt = expiresAt;

  if (payload.notes !== undefined) {
    booking.notes = payload.notes;
  }

  booking.updatedBy = new Types.ObjectId(actorId);
  await booking.save();

  if (previousStatus === "waitlisted") {
    await RetreatBatch.findByIdAndUpdate(booking.retreatBatch, {
      $inc: { waitlistCount: -1 },
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
      invitationExpiresAt: expiresAt.toISOString(),
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: invitedBookingId,
    metadata: {
      status: booking.status,
      invitationExpiresAt: expiresAt.toISOString(),
    },
    dedupeKey: `retreat_booking_invited:${invitedBookingId}:${expiresAt.getTime()}`,
  });

  return booking.populate(BOOKING_POPULATE);
};

const confirmRetreatBookingAdmin = async (
  bookingId: string,
  payload: IConfirmRetreatBookingAdmin,
  actorId: string,
) => {
  const test = assertValidObjectId(bookingId, "Retreat booking ID");


  const booking = await RetreatBooking.findById(bookingId);
  assertFound(booking, "Retreat booking not found", 404);

  if (booking.status === "confirmed") {
    throwServiceError("Booking is already confirmed", 400);
  }

  const previousStatus = booking.status;
  const batch = await RetreatBatch.findById(booking.retreatBatch);
  assertFound(batch, "Retreat batch not found", 404);

  if (batch.confirmedBookingsCount >= batch.capacity) {
    throwServiceError(
      `Cannot confirm booking: Batch capacity (${batch.capacity}) is already reached.`,
      409,
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
  booking.confirmedAt = new Date();
  booking.paidAt = new Date();

  if (payload.notes !== undefined) {
    booking.notes = payload.notes;
  }

  booking.updatedBy = new Types.ObjectId(actorId);
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
      currency: booking.currency,
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: confirmedBookingId,
    metadata: {
      status: booking.status,
      amountPaid: booking.amountPaid ?? booking.amount,
    },
    dedupeKey: `retreat_booking_confirmed:${confirmedBookingId}`,
  });

  return booking.populate(BOOKING_POPULATE);
};

const cancelRetreatBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole,
}: {
  bookingId: string;
  payload: ICancelRetreatBooking;
  actorId: string;
  actorRole?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Retreat booking ID");

  const booking = await RetreatBooking.findById(bookingId);
  assertFound(booking, "Retreat booking not found", 404);

  const isOwner = String(booking.user) === actorId;
  const isAdmin = actorRole === "admin" || actorRole === "manager" || actorRole === "founder" || actorRole === "super_admin";

  if (!isOwner && !isAdmin) {
    throwServiceError("You are not authorized to cancel this retreat booking", 403);
  }

  if (booking.status === "cancelled") {
    throwServiceError("Retreat booking is already cancelled", 400);
  }

  if (booking.status === "refunded") {
    throwServiceError("Refunded retreat booking cannot be cancelled", 400);
  }

  const previousStatus = booking.status;

  booking.status = "cancelled";
  booking.cancellationReason = payload.reason;
  booking.cancelledAt = new Date();
  booking.updatedBy = new Types.ObjectId(actorId);
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
        reason: payload.reason,
      },
      relatedEntityType: "RetreatBooking",
      relatedEntityId: cancelledBookingId,
      metadata: {
        status: booking.status,
        reason: payload.reason,
      },
      dedupeKey: `retreat_booking_cancelled:${cancelledBookingId}`,
    });
  }

  return booking.populate(BOOKING_POPULATE);
};

const refundRetreatBooking = async (
  bookingId: string,
  payload: IRefundRetreatBooking,
  actorId: string,
) => {
  assertValidObjectId(bookingId, "Retreat booking ID");

  const booking = await RetreatBooking.findById(bookingId);
  assertFound(booking, "Retreat booking not found", 404);

  if (booking.status !== "confirmed") {
    throwServiceError("Only confirmed retreat bookings can be refunded", 400);
  }

  const refundAmount =
    payload.refundAmount ?? booking.amountPaid ?? booking.amount;


  // -------------------------------------------------
  // 1. Real Stripe refund
  // -------------------------------------------------
  if (booking.stripePaymentIntentId) {
    if (!stripe) {
      throwServiceError(
        "Stripe is not configured. Cannot process refund.",
        500,
      );
    }

    const stripeClient = getStripeClient();

    try {
      await stripeClient.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100),
        reason: "requested_by_customer",
        metadata: {
          bookingId: String(booking._id),
          refundedBy: actorId,
          reason: payload.reason ?? "Customer requested",
        },
      });

      // Optional: store the Stripe refund ID
      // booking.stripeRefundId = stripeRefund.id;
    } catch (err: any) {
      throwServiceError(
        err?.message || "Failed to process refund with Stripe",
        400,
      );
    }
  } else {
    throwServiceError(
      "This booking has no Stripe payment intent. Cannot process a real refund.",
      400,
    );
  }

  // -------------------------------------------------
  // 2. Update booking in DB
  // -------------------------------------------------
  booking.status = "refunded";
  booking.refundedAt = new Date();
  booking.refundAmount = refundAmount;

  if (payload.reason !== undefined) {
    booking.refundReason = payload.reason;
  }

  booking.updatedBy = new Types.ObjectId(actorId);
  await booking.save();

  // -------------------------------------------------
  // 3. Update batch capacity
  // -------------------------------------------------
  const batch = await RetreatBatch.findById(booking.retreatBatch);
  if (batch && batch.confirmedBookingsCount > 0) {
    batch.confirmedBookingsCount -= 1;
    if (batch.status === "sold_out") {
      batch.status = "open";
    }
    await batch.save();
  }

  // -------------------------------------------------
  // 4. Notification
  // -------------------------------------------------
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
      reason: booking.refundReason ?? "",
    },
    relatedEntityType: "RetreatBooking",
    relatedEntityId: refundedBookingId,
    metadata: {
      status: booking.status,
      refundAmount: booking.refundAmount ?? null,
      reason: booking.refundReason ?? null,
    },
    dedupeKey: `retreat_booking_refunded:${refundedBookingId}`,
  });

  return booking.populate(BOOKING_POPULATE);
};

const updateRetreatBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole,
}: {
  bookingId: string;
  payload: IUpdateRetreatBooking;
  actorId: string;
  actorRole?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Retreat booking ID");

  const booking = await RetreatBooking.findById(bookingId);
  assertFound(booking, "Retreat booking not found", 404);

  const isOwner = String(booking.user) === actorId;
  const isAdmin = actorRole === "admin" || actorRole === "manager" || actorRole === "founder" || actorRole === "super_admin";

  if (!isOwner && !isAdmin) {
    throwServiceError("You are not authorized to update this retreat booking", 403);
  }

  if (payload.notes !== undefined) {
    booking.notes = payload.notes;
  }

  if (payload.specialRequests !== undefined) {
    booking.specialRequests = payload.specialRequests;
  }

  if (payload.dietaryRequirements !== undefined) {
    booking.dietaryRequirements = payload.dietaryRequirements;
  }

  if (payload.emergencyContact !== undefined) {
    booking.emergencyContact = payload.emergencyContact;
  }

  booking.updatedBy = new Types.ObjectId(actorId);
  await booking.save();

  return booking.populate(BOOKING_POPULATE);
};

const getMyRetreatBookings = async (
  userId: string,
  query: IRetreatBookingQuery = {},
) => {
  assertValidObjectId(userId, "User ID");

  const filter: QueryFilter<IRetreatBooking> = {
    user: new Types.ObjectId(userId),
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.batchId) {
    assertValidObjectId(query.batchId, "Retreat batch ID");
    filter.retreatBatch = new Types.ObjectId(query.batchId);
  }

  if (query.locationId) {
    assertValidObjectId(query.locationId, "Retreat location ID");
    filter.retreatLocation = new Types.ObjectId(query.locationId);
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    RetreatBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(BOOKING_POPULATE)
      .lean(),
    RetreatBooking.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: bookings,
  };
};

const getMySingleRetreatBooking = async (
  bookingId: string,
  userId: string,
) => {
  assertValidObjectId(bookingId, "Retreat booking ID");
  assertValidObjectId(userId, "User ID");

  const booking = await RetreatBooking.findOne({
    _id: new Types.ObjectId(bookingId),
    user: new Types.ObjectId(userId),
  }).populate(BOOKING_POPULATE).lean();

  assertFound(booking, "Retreat booking not found", 404);
  return booking;
};

const getAllRetreatBookingsAdmin = async (query: IRetreatBookingQuery = {}) => {
  const filter: QueryFilter<IRetreatBooking> = {};

  if (query.userId) {
    assertValidObjectId(query.userId, "User ID");
    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.batchId) {
    assertValidObjectId(query.batchId, "Retreat batch ID");
    filter.retreatBatch = new Types.ObjectId(query.batchId);
  }

  if (query.locationId) {
    assertValidObjectId(query.locationId, "Retreat location ID");
    filter.retreatLocation = new Types.ObjectId(query.locationId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    RetreatBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(BOOKING_POPULATE)
      .lean(),
    RetreatBooking.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: bookings,
  };
};

const getSingleRetreatBookingAdmin = async (bookingId: string) => {
  assertValidObjectId(bookingId, "Retreat booking ID");

  const booking = await RetreatBooking.findById(bookingId).populate(
    BOOKING_POPULATE,
  ).lean();
  assertFound(booking, "Retreat booking not found", 404);

  return booking;
};

export const retreatBookingService = {
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
  getSingleRetreatBookingAdmin,
};
