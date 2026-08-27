import { QueryFilter, Types } from "mongoose";

import { User } from "../users/users.model.schema";
import { MentorshipProfile } from "../mentorshipProfiles/mentorship.profile.model.schema";
import { notificationService } from "../notifications/notification.service";
import type { ICloudinaryVideoUpload } from "../../utility/cloudinaryMedia";

import {
  ICancelMentorBooking,
  ICompleteMentorBooking,
  IConfirmMentorBooking,
  ICreateMentorBooking,
  IMentorBooking,
  IMentorBookingQuery,
  IMentorBookingRecording,
  INoShowMentorBooking,
  IUpdateMentorBooking,
  MentorBookingStatus,
} from "./mentor.booking.interface";

import { MentorBooking } from "./mentor.booking.model.schema";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

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

const isAdminOrManager = (role?: string | undefined): boolean => {
  return role === "admin" || role === "manager" || role === "founder" || role === "super_admin";
};

const BOOKING_POPULATE = [
  {
    path: "member",
    select: "fullName email role profileImage phone city country",
  },
  {
    path: "leadMentor",
    select: "fullName email role profileImage",
  },
  {
    path: "leadMentorProfile",
    select: "bio expertise profileImage sessionDurationMinutes isPrimaryMentor status",
  },
  {
    path: "coMentor",
    select: "fullName email role profileImage",
  },
  {
    path: "coMentorProfile",
    select: "bio expertise profileImage sessionDurationMinutes isPrimaryMentor status",
  },
  {
    path: "cancelledBy",
    select: "fullName email role",
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

const checkUserExists = async (userId: string, label: string) => {
  assertValidObjectId(userId, label);

  const user = await User.findById(userId).select("_id fullName email role").lean();

  assertFound(user, `${label} not found`, 404);

  return user;
};

const resolveMentorshipProfileId = async (
  mentorUserId: string,
  explicitProfileId?: string,
): Promise<Types.ObjectId | undefined> => {
  if (explicitProfileId) {
    assertValidObjectId(explicitProfileId, "Mentorship profile ID");

    const profile = await MentorshipProfile.findById(explicitProfileId).lean();

    assertFound(profile, "Mentorship profile not found", 404);

    if (String(profile.mentor) !== mentorUserId) {
      throwServiceError(
        "Provided mentorship profile does not belong to the selected mentor",
        400,
      );
    }

    return profile._id as Types.ObjectId;
  }

  const profile = await MentorshipProfile.findOne({
    mentor: new Types.ObjectId(mentorUserId),
    isActive: true,
  }).lean();

  return profile ? (profile._id as Types.ObjectId) : undefined;
};



const checkSchedulingConflicts = async ({
  memberId,
  leadMentorId,
  coMentorId,
  startTime,
  endTime,
  excludeBookingId,
}: {
  memberId: string;
  leadMentorId: string;
  coMentorId?: string | undefined;
  startTime: Date;
  endTime: Date;
  excludeBookingId?: string | undefined;
}) => {
  const activeStatuses: MentorBookingStatus[] = ["requested", "confirmed"];

  const baseOverlapFilter: Record<string, unknown> = {
    status: { $in: activeStatuses },
    scheduledStartTime: { $lt: endTime },
    scheduledEndTime: { $gt: startTime },
  };

  if (excludeBookingId) {
    baseOverlapFilter._id = { $ne: new Types.ObjectId(excludeBookingId) };
  }

  // 1. Check member conflicts
  const memberConflict = await MentorBooking.findOne({
    ...baseOverlapFilter,
    member: new Types.ObjectId(memberId),
  });

  if (memberConflict) {
    throwServiceError(
      "You already have a pending or confirmed booking in this time slot",
      409,
    );
  }

  // 2. Check lead mentor conflicts (as leadMentor, coMentor, or member)
  const leadMentorConflict = await MentorBooking.findOne({
    ...baseOverlapFilter,
    $or: [
      { leadMentor: new Types.ObjectId(leadMentorId) },
      { coMentor: new Types.ObjectId(leadMentorId) },
      { member: new Types.ObjectId(leadMentorId) },
    ],
  });

  if (leadMentorConflict) {
    throwServiceError(
      "The lead mentor already has a scheduled session during this time slot",
      409,
    );
  }

  // 3. Check co-mentor conflicts if specified
  if (coMentorId) {
    const coMentorConflict = await MentorBooking.findOne({
      ...baseOverlapFilter,
      $or: [
        { leadMentor: new Types.ObjectId(coMentorId) },
        { coMentor: new Types.ObjectId(coMentorId) },
        { member: new Types.ObjectId(coMentorId) },
      ],
    });

    if (coMentorConflict) {
      throwServiceError(
        "The co-mentor already has a scheduled session during this time slot",
        409,
      );
    }
  }
};

const createBooking = async (
  payload: ICreateMentorBooking,
  memberUserId: string,
  actorId: string,
) => {
  assertValidObjectId(payload.leadMentor, "Lead mentor ID");
  assertValidObjectId(memberUserId, "Member user ID");

  const memberUser = await checkUserExists(memberUserId, "Member user");

  if (memberUserId === payload.leadMentor) {
    throwServiceError("A member cannot book a mentorship session with themselves", 400);
  }

  if (payload.coMentor) {
    assertValidObjectId(payload.coMentor, "Co-mentor ID");

    if (memberUserId === payload.coMentor) {
      throwServiceError("A member cannot add themselves as co-mentor", 400);
    }

    if (payload.leadMentor === payload.coMentor) {
      throwServiceError("Lead mentor and co-mentor cannot be the same user", 400);
    }

    await checkUserExists(payload.coMentor, "Co-mentor user");
  }

  await checkUserExists(payload.leadMentor, "Lead mentor user");

  const startTime = new Date(payload.scheduledStartTime);

  if (Number.isNaN(startTime.getTime())) {
    throwServiceError("Invalid scheduledStartTime format", 400);
  }

  const durationMinutes = payload.durationMinutes ?? 60;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // Check conflicts
  await checkSchedulingConflicts({
    memberId: memberUserId,
    leadMentorId: payload.leadMentor,
    coMentorId: payload.coMentor,
    startTime,
    endTime,
  });

  const leadMentorProfileId = await resolveMentorshipProfileId(
    payload.leadMentor,
    payload.leadMentorProfile,
  );

  let coMentorProfileId: Types.ObjectId | undefined;

  if (payload.coMentor) {
    coMentorProfileId = await resolveMentorshipProfileId(
      payload.coMentor,
      payload.coMentorProfile,
    );
  }

  const createData: Record<string, unknown> = {
    member: new Types.ObjectId(memberUserId),
    leadMentor: new Types.ObjectId(payload.leadMentor),
    scheduledStartTime: startTime,
    scheduledEndTime: endTime,
    durationMinutes,
    timezone: payload.timezone,
    status: "requested",
    createdBy: new Types.ObjectId(actorId),
  };

  if (leadMentorProfileId) {
    createData.leadMentorProfile = leadMentorProfileId;
  }

  if (payload.coMentor) {
    createData.coMentor = new Types.ObjectId(payload.coMentor);
  }

  if (coMentorProfileId) {
    createData.coMentorProfile = coMentorProfileId;
  }

  if (payload.sessionTopic !== undefined) {
    createData.sessionTopic = payload.sessionTopic;
  }

  if (payload.notes !== undefined) {
    createData.notes = payload.notes;
  }

  if (payload.meetingUrl !== undefined) {
    createData.meetingUrl = payload.meetingUrl;
  }

  const booking = await MentorBooking.create(createData);

  const bookingId = String(booking._id);

  const mentorRecipients = [
    String(booking.leadMentor),
    ...(booking.coMentor ? [String(booking.coMentor)] : []),
  ];

  await Promise.all(
    mentorRecipients.map((recipientId) =>
      notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_requested",
        fallbackTitle: "New mentorship booking request",
        fallbackBody: `${memberUser.fullName} requested a mentorship session.`,
        recipient: recipientId,
        actor: memberUserId,
        variables: {
          memberName: memberUser.fullName,
          bookingId,
          scheduledStartTime: booking.scheduledStartTime.toISOString(),
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: bookingId,
        metadata: {
          status: booking.status,
          timezone: booking.timezone,
        },
        dedupeKey: `mentor_booking_requested:${bookingId}:${recipientId}`,
      }),
    ),
  );

  return booking.populate(BOOKING_POPULATE);
};

const getMyMemberBookings = async (
  memberUserId: string,
  query: IMentorBookingQuery = {},
) => {
  assertValidObjectId(memberUserId, "Member user ID");

  const filter: QueryFilter<IMentorBooking> = {
    member: new Types.ObjectId(memberUserId),
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    const timeFilter: Record<string, unknown> = {};

    if (query.startDate) {
      timeFilter.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      timeFilter.$lte = new Date(query.endDate);
    }

    filter.scheduledStartTime = timeFilter as unknown as Date;
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    MentorBooking.find(filter)
      .sort({ scheduledStartTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate(BOOKING_POPULATE)
      .lean(),
    MentorBooking.countDocuments(filter),
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

const getMyMemberSingleBooking = async (
  bookingId: string,
  memberUserId: string,
) => {
  assertValidObjectId(bookingId, "Booking ID");
  assertValidObjectId(memberUserId, "Member user ID");

  const booking = await MentorBooking.findOne({
    _id: new Types.ObjectId(bookingId),
    member: new Types.ObjectId(memberUserId),
  }).populate(BOOKING_POPULATE).lean();

  assertFound(booking, "Mentor booking not found", 404);

  return booking;
};

const MENTOR_FIELD_POPULATE = {
  path: "mentor",
  select: "fullName email role profileImage",
};

const ACTIVE_BOOKING_STATUSES: MentorBookingStatus[] = [
  "confirmed",
  "completed",
  "requested",
];

/**
 * The next session to surface on the "book / join" card: the soonest
 * upcoming CONFIRMED booking, falling back to the member's most recent
 * booking of any active status (so there's still something useful to show
 * — e.g. a pending "requested" booking awaiting mentor confirmation).
 */
const resolveNextSession = async (memberObjectId: Types.ObjectId) => {
  const now = new Date();

  const upcomingBooking = await MentorBooking.findOne({
    member: memberObjectId,
    status: "confirmed",
    scheduledStartTime: { $gte: now },
  })
    .sort({ scheduledStartTime: 1 })
    .populate(BOOKING_POPULATE)
    .lean();

  if (upcomingBooking) return upcomingBooking;

  return MentorBooking.findOne({
    member: memberObjectId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  })
    .sort({ scheduledStartTime: -1 })
    .populate(BOOKING_POPULATE)
    .lean();
};

/**
 * Resolves the member's accountability pairing for the accountability page:
 *
 *  - `primaryMentor`: the platform's single configured primary mentor
 *    (MentorshipProfile.isPrimaryMentor === true). Same for every member.
 *  - `coMentor`: the non-primary mentor the member selected for themselves
 *    (typically at purchase/onboarding time), stored on
 *    User.assignedCoMentorProfile. Null if they haven't picked one yet.
 *  - `nextSession`: the member's soonest upcoming confirmed booking (or
 *    most recent active booking as a fallback), for the "book / join" card.
 *    This is informational only and does not affect who the mentor/co-mentor
 *    are — that's driven purely by the assignment above.
 */
const getMyMentor = async (memberUserId: string) => {
  assertValidObjectId(memberUserId, "Member user ID");

  const memberObjectId = new Types.ObjectId(memberUserId);

  const [primaryProfile, member, nextSession] = await Promise.all([
    MentorshipProfile.findOne({
      isPrimaryMentor: true,
      isActive: true,
      status: "published",
    })
      .populate(MENTOR_FIELD_POPULATE)
      .lean(),

    User.findById(memberObjectId)
      .select("_id assignedCoMentorProfile coMentorAssignedAt")
      .populate({
        path: "assignedCoMentorProfile",
        populate: MENTOR_FIELD_POPULATE,
      })
      .lean(),

    resolveNextSession(memberObjectId),
  ]);

  assertFound(
    primaryProfile,
    "No primary mentor is currently configured",
    404,
  );

  const coMentorProfile =
    (member as { assignedCoMentorProfile?: unknown } | null)
      ?.assignedCoMentorProfile ?? null;

  return {
    primaryMentor: {
      mentor: primaryProfile.mentor,
      mentorProfile: primaryProfile,
    },
    coMentor: coMentorProfile
      ? {
          mentor: (coMentorProfile as { mentor: unknown }).mentor,
          mentorProfile: coMentorProfile,
        }
      : null,
    nextSession: nextSession ?? null,
  };
};

const getMyMentorBookings = async (
  mentorUserId: string,
  query: IMentorBookingQuery = {},
) => {
  assertValidObjectId(mentorUserId, "Mentor user ID");

  const mentorObjectId = new Types.ObjectId(mentorUserId);

  const filter: QueryFilter<IMentorBooking> = {
    $or: [{ leadMentor: mentorObjectId }, { coMentor: mentorObjectId }],
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    const timeFilter: Record<string, unknown> = {};

    if (query.startDate) {
      timeFilter.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      timeFilter.$lte = new Date(query.endDate);
    }

    filter.scheduledStartTime = timeFilter as unknown as Date;
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    MentorBooking.find(filter)
      .sort({ scheduledStartTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate(BOOKING_POPULATE)
      .lean(),
    MentorBooking.countDocuments(filter),
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

const getMyMentorSingleBooking = async (
  bookingId: string,
  mentorUserId: string,
) => {
  assertValidObjectId(bookingId, "Booking ID");
  assertValidObjectId(mentorUserId, "Mentor user ID");

  const mentorObjectId = new Types.ObjectId(mentorUserId);

  const booking = await MentorBooking.findOne({
    _id: new Types.ObjectId(bookingId),
    $or: [{ leadMentor: mentorObjectId }, { coMentor: mentorObjectId }],
  }).populate(BOOKING_POPULATE).lean();

  assertFound(booking, "Mentor booking not found", 404);

  return booking;
};

const getAllBookingsAdmin = async (query: IMentorBookingQuery = {}) => {
  const filter: QueryFilter<IMentorBooking> = {};

  if (query.memberId) {
    assertValidObjectId(query.memberId, "Member ID");
    filter.member = new Types.ObjectId(query.memberId);
  }

  if (query.leadMentorId) {
    assertValidObjectId(query.leadMentorId, "Lead mentor ID");
    filter.leadMentor = new Types.ObjectId(query.leadMentorId);
  }

  if (query.coMentorId) {
    assertValidObjectId(query.coMentorId, "Co-mentor ID");
    filter.coMentor = new Types.ObjectId(query.coMentorId);
  }

  if (query.mentorId) {
    assertValidObjectId(query.mentorId, "Mentor ID");
    const mentorObjId = new Types.ObjectId(query.mentorId);
    filter.$or = [{ leadMentor: mentorObjId }, { coMentor: mentorObjId }];
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    const timeFilter: Record<string, unknown> = {};

    if (query.startDate) {
      timeFilter.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      timeFilter.$lte = new Date(query.endDate);
    }

    filter.scheduledStartTime = timeFilter as unknown as Date;
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    MentorBooking.find(filter)
      .sort({ scheduledStartTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate(BOOKING_POPULATE)
      .lean(),
    MentorBooking.countDocuments(filter),
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

const getSingleBookingAdmin = async (bookingId: string) => {
  assertValidObjectId(bookingId, "Booking ID");

  const booking = await MentorBooking.findById(bookingId).populate(
    BOOKING_POPULATE,
  ).lean();

  assertFound(booking, "Mentor booking not found", 404);

  return booking;
};

const updateBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole,
}: {
  bookingId: string;
  payload: IUpdateMentorBooking;
  actorId: string;
  actorRole?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Booking ID");

  const booking = await MentorBooking.findById(bookingId);

  assertFound(booking, "Mentor booking not found", 404);

  const isMember = String(booking.member) === actorId;
  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager(actorRole);

  if (!isMember && !isLead && !isCo && !isAdmin) {
    throwServiceError("You are not authorized to update this booking", 403);
  }

  if (booking.status === "completed" || booking.status === "cancelled" || booking.status === "no_show") {
    throwServiceError(
      `Cannot update a booking that is already ${booking.status}`,
      400,
    );
  }

  const newLeadMentorId = payload.leadMentor ?? String(booking.leadMentor);

  let newCoMentorId: string | undefined = booking.coMentor
    ? String(booking.coMentor)
    : undefined;

  if (payload.coMentor === null) {
    newCoMentorId = undefined;
  } else if (payload.coMentor !== undefined) {
    newCoMentorId = payload.coMentor;
  }

  if (String(booking.member) === newLeadMentorId) {
    throwServiceError("A member cannot book a mentorship session with themselves", 400);
  }

  if (newCoMentorId && String(booking.member) === newCoMentorId) {
    throwServiceError("A member cannot add themselves as co-mentor", 400);
  }

  if (newCoMentorId && newLeadMentorId === newCoMentorId) {
    throwServiceError("Lead mentor and co-mentor cannot be the same user", 400);
  }

  if (payload.leadMentor && payload.leadMentor !== String(booking.leadMentor)) {
    await checkUserExists(payload.leadMentor, "Lead mentor user");
    booking.leadMentor = new Types.ObjectId(payload.leadMentor);
  }

  if (payload.coMentor !== undefined) {
    if (payload.coMentor === null) {
      booking.set("coMentor", undefined);
      booking.set("coMentorProfile", undefined);
    } else {
      await checkUserExists(payload.coMentor, "Co-mentor user");
      booking.coMentor = new Types.ObjectId(payload.coMentor);
    }
  }

  if (payload.leadMentorProfile !== undefined) {
    const profileId = await resolveMentorshipProfileId(
      newLeadMentorId,
      payload.leadMentorProfile,
    );

    if (profileId) {
      booking.leadMentorProfile = profileId;
    } else {
      booking.set("leadMentorProfile", undefined);
    }
  }

  if (payload.coMentorProfile !== undefined && newCoMentorId) {
    const profileId = await resolveMentorshipProfileId(
      newCoMentorId,
      payload.coMentorProfile ?? undefined,
    );

    if (profileId) {
      booking.coMentorProfile = profileId;
    } else {
      booking.set("coMentorProfile", undefined);
    }
  }

  const durationMinutes = payload.durationMinutes ?? booking.durationMinutes;
  let startTime = booking.scheduledStartTime;

  if (payload.scheduledStartTime) {
    startTime = new Date(payload.scheduledStartTime);

    if (Number.isNaN(startTime.getTime())) {
      throwServiceError("Invalid scheduledStartTime format", 400);
    }
  }

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // Check conflicts if time or participants changed
  await checkSchedulingConflicts({
    memberId: String(booking.member),
    leadMentorId: newLeadMentorId,
    coMentorId: newCoMentorId,
    startTime,
    endTime,
    excludeBookingId: String(booking._id),
  });

  booking.scheduledStartTime = startTime;
  booking.scheduledEndTime = endTime;
  booking.durationMinutes = durationMinutes;

  if (payload.timezone !== undefined) {
    booking.timezone = payload.timezone;
  }

  if (payload.sessionTopic !== undefined) {
    booking.sessionTopic = payload.sessionTopic;
  }

  if (payload.notes !== undefined) {
    booking.notes = payload.notes;
  }

  if (payload.meetingUrl === null) {
    booking.set("meetingUrl", undefined);
  } else if (payload.meetingUrl !== undefined) {
    booking.meetingUrl = payload.meetingUrl;
  }

  booking.updatedBy = new Types.ObjectId(actorId);

  await booking.save();

  const updatedBookingId = String(booking._id);
  const updateRecipients = [
    String(booking.member),
    String(booking.leadMentor),
    ...(booking.coMentor ? [String(booking.coMentor)] : []),
  ].filter((recipientId, index, all) =>
    recipientId !== actorId && all.indexOf(recipientId) === index,
  );

  await Promise.all(
    updateRecipients.map((recipientId) =>
      notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_updated",
        fallbackTitle: "Mentorship booking updated",
        fallbackBody: "A mentorship booking you are part of has been updated.",
        recipient: recipientId,
        actor: actorId,
        variables: {
          bookingId: updatedBookingId,
          scheduledStartTime: booking.scheduledStartTime.toISOString(),
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: updatedBookingId,
        metadata: {
          status: booking.status,
          timezone: booking.timezone,
        },
        dedupeKey: `mentor_booking_updated:${updatedBookingId}:${booking.updatedAt?.getTime() ?? Date.now()}:${recipientId}`,
      }),
    ),
  );

  return booking.populate(BOOKING_POPULATE);
};

const confirmBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole,
}: {
  bookingId: string;
  payload: IConfirmMentorBooking;
  actorId: string;
  actorRole?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Booking ID");

  const booking = await MentorBooking.findById(bookingId);

  assertFound(booking, "Mentor booking not found", 404);

  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager(actorRole);

  if (!isLead && !isCo && !isAdmin) {
    throwServiceError("Only assigned mentors or administrators can confirm bookings", 403);
  }

  if (booking.status === "confirmed") {
    // Idempotent re-confirm: allow updating the title/link/notes without
    // re-running the conflict check or re-sending the "confirmed" notification.
    booking.sessionTopic = payload.sessionTopic;
    booking.meetingUrl = payload.meetingUrl;

    if (payload.notes !== undefined) {
      booking.notes = payload.notes;
    }

    booking.updatedBy = new Types.ObjectId(actorId);
    await booking.save();
    return booking.populate(BOOKING_POPULATE);
  }

  if (booking.status !== "requested") {
    throwServiceError(`Cannot confirm a booking with status "${booking.status}"`, 400);
  }

  // Re-verify conflicts before confirming
  await checkSchedulingConflicts({
    memberId: String(booking.member),
    leadMentorId: String(booking.leadMentor),
    coMentorId: booking.coMentor ? String(booking.coMentor) : undefined,
    startTime: booking.scheduledStartTime,
    endTime: booking.scheduledEndTime,
    excludeBookingId: String(booking._id),
  });

  booking.status = "confirmed";
  booking.sessionTopic = payload.sessionTopic;
  booking.meetingUrl = payload.meetingUrl;

  if (payload.notes !== undefined) {
    booking.notes = payload.notes;
  }

  booking.updatedBy = new Types.ObjectId(actorId);

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
      meetingUrl: booking.meetingUrl ?? "",
    },
    relatedEntityType: "MentorBooking",
    relatedEntityId: confirmedBookingId,
    metadata: {
      status: booking.status,
      meetingUrl: booking.meetingUrl ?? null,
    },
    dedupeKey: `mentor_booking_confirmed:${confirmedBookingId}`,
  });

  return booking.populate(BOOKING_POPULATE);
};

const cancelBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole,
}: {
  bookingId: string;
  payload: ICancelMentorBooking;
  actorId: string;
  actorRole?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Booking ID");

  const booking = await MentorBooking.findById(bookingId);

  assertFound(booking, "Mentor booking not found", 404);

  const isMember = String(booking.member) === actorId;
  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager(actorRole);

  if (!isMember && !isLead && !isCo && !isAdmin) {
    throwServiceError("You are not authorized to cancel this booking", 403);
  }

  if (booking.status === "cancelled") {
    throwServiceError("Booking is already cancelled", 400);
  }

  if (booking.status === "completed") {
    throwServiceError("Completed booking cannot be cancelled", 400);
  }

  booking.status = "cancelled";
  booking.cancellationReason = payload.reason;
  booking.cancelledBy = new Types.ObjectId(actorId);
  booking.cancelledAt = new Date();
  booking.updatedBy = new Types.ObjectId(actorId);

  await booking.save();

  const cancelledBookingId = String(booking._id);
  const cancellationRecipients = [
    String(booking.member),
    String(booking.leadMentor),
    ...(booking.coMentor ? [String(booking.coMentor)] : []),
  ].filter((recipientId, index, all) =>
    recipientId !== actorId && all.indexOf(recipientId) === index,
  );

  await Promise.all(
    cancellationRecipients.map((recipientId) =>
      notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_cancelled",
        fallbackTitle: "Mentorship booking cancelled",
        fallbackBody: `A mentorship booking has been cancelled. Reason: ${payload.reason}`,
        recipient: recipientId,
        actor: actorId,
        variables: {
          bookingId: cancelledBookingId,
          reason: payload.reason,
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: cancelledBookingId,
        metadata: {
          status: booking.status,
          reason: payload.reason,
        },
        dedupeKey: `mentor_booking_cancelled:${cancelledBookingId}:${recipientId}`,
      }),
    ),
  );

  return booking.populate(BOOKING_POPULATE);
};

const completeBooking = async ({
  bookingId,
  payload,
  recording,
  actorId,
  actorRole,
}: {
  bookingId: string;
  payload: ICompleteMentorBooking;
  recording: ICloudinaryVideoUpload;
  actorId: string;
  actorRole?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Booking ID");

  if (!payload.recordingTitle || !payload.recordingTitle.trim()) {
    throwServiceError(
      "A title for the session recording is required",
      400,
    );
  }

  if (!recording || !recording.secureUrl || !recording.cloudinaryPublicId) {
    throwServiceError(
      "A recording of the session is required to mark it as completed",
      400,
    );
  }

  const booking = await MentorBooking.findById(bookingId);

  assertFound(booking, "Mentor booking not found", 404);

  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager(actorRole);

  if (!isLead && !isCo && !isAdmin) {
    throwServiceError("Only assigned mentors or administrators can complete bookings", 403);
  }

  if (booking.status === "cancelled") {
    throwServiceError("Cancelled booking cannot be marked as completed", 400);
  }

  if (booking.status === "no_show") {
    throwServiceError("No-show booking cannot be marked as completed", 400);
  }

  booking.status = "completed";
  booking.completedAt = new Date();

  booking.recordingTitle = payload.recordingTitle.trim();

  const recordingData: IMentorBookingRecording = {
    provider: "cloudinary",
    cloudinaryPublicId: recording.cloudinaryPublicId,
    secureUrl: recording.secureUrl,
    playbackUrl: recording.playbackUrl,
    thumbnailUrl: recording.thumbnailUrl,
    durationSeconds: recording.durationSeconds,
  };

  if (recording.cloudinaryAssetId !== undefined) {
    recordingData.cloudinaryAssetId = recording.cloudinaryAssetId;
  }

  if (recording.format !== undefined) {
    recordingData.format = recording.format;
  }

  if (recording.bytes !== undefined) {
    recordingData.bytes = recording.bytes;
  }

  booking.recording = recordingData;

  if (payload.mentorFeedback !== undefined) {
    booking.mentorFeedback = payload.mentorFeedback;
  }

  booking.updatedBy = new Types.ObjectId(actorId);

  await booking.save();

  const completedBookingId = String(booking._id);

  await notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "mentor_booking_completed",
    fallbackTitle: "Mentorship session completed",
    fallbackBody: "Your mentorship session has been marked as completed.",
    recipient: String(booking.member),
    actor: actorId,
    variables: {
      bookingId: completedBookingId,
    },
    relatedEntityType: "MentorBooking",
    relatedEntityId: completedBookingId,
    metadata: {
      status: booking.status,
    },
    dedupeKey: `mentor_booking_completed:${completedBookingId}`,
  });

  return booking.populate(BOOKING_POPULATE);
};

const markNoShowBooking = async ({
  bookingId,
  payload,
  actorId,
  actorRole,
}: {
  bookingId: string;
  payload: INoShowMentorBooking;
  actorId: string;
  actorRole?: string | undefined;
}) => {
  assertValidObjectId(bookingId, "Booking ID");

  const booking = await MentorBooking.findById(bookingId);

  assertFound(booking, "Mentor booking not found", 404);

  const isLead = String(booking.leadMentor) === actorId;
  const isCo = booking.coMentor ? String(booking.coMentor) === actorId : false;
  const isAdmin = isAdminOrManager(actorRole);

  if (!isLead && !isCo && !isAdmin) {
    throwServiceError("Only assigned mentors or administrators can record no-shows", 403);
  }

  if (booking.status === "cancelled") {
    throwServiceError("Cancelled booking cannot be marked as no-show", 400);
  }

  if (booking.status === "completed") {
    throwServiceError("Completed booking cannot be marked as no-show", 400);
  }

  booking.status = "no_show";
  booking.noShowAt = new Date();
  booking.noShowBy = payload.noShowBy;

  if (payload.reason !== undefined) {
    booking.noShowReason = payload.reason;
  }

  booking.updatedBy = new Types.ObjectId(actorId);

  await booking.save();

  const noShowBookingId = String(booking._id);
  const noShowRecipients = [
    String(booking.member),
    String(booking.leadMentor),
    ...(booking.coMentor ? [String(booking.coMentor)] : []),
  ].filter((recipientId, index, all) =>
    recipientId !== actorId && all.indexOf(recipientId) === index,
  );

  await Promise.all(
    noShowRecipients.map((recipientId) =>
      notificationService.safeCreateFromTemplateOrFallback({
        templateKey: "mentor_booking_no_show",
        fallbackTitle: "Mentorship no-show recorded",
        fallbackBody: "A no-show has been recorded for a mentorship booking.",
        recipient: recipientId,
        actor: actorId,
        variables: {
          bookingId: noShowBookingId,
          noShowBy: payload.noShowBy,
          reason: payload.reason ?? "",
        },
        relatedEntityType: "MentorBooking",
        relatedEntityId: noShowBookingId,
        metadata: {
          status: booking.status,
          noShowBy: payload.noShowBy,
          reason: payload.reason ?? null,
        },
        dedupeKey: `mentor_booking_no_show:${noShowBookingId}:${recipientId}`,
      }),
    ),
  );

  return booking.populate(BOOKING_POPULATE);
};

export const mentorBookingService = {
  createBooking,
  getMyMemberBookings,
  getMyMemberSingleBooking,
  getMyMentor,
  getMyMentorBookings,
  getMyMentorSingleBooking,
  getAllBookingsAdmin,
  getSingleBookingAdmin,
  updateBooking,
  confirmBooking,
  cancelBooking,
  completeBooking,
  markNoShowBooking,
};