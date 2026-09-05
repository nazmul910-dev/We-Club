import { ClientSession, QueryFilter, Types } from "mongoose";

import { User } from "../users/users.model.schema";

import {
  ICreateMentorInput,
  ICreateMentorshipProfile,
  IMentorshipProfile,
  IUpdateMentorshipProfile,
} from "./mentorship.profile.interface";

import { MentorshipProfile } from "./mentorship.profile.model.schema";

interface MentorUserDoc {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  role: string;
  save: (options?: { session?: ClientSession }) => Promise<MentorUserDoc>;
}


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
  return (
    role === "founder" ||
    role === "super_admin" ||
    role === "admin" ||
    role === "manager"
  );
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const PROFILE_POPULATE = [
  {
    path: "mentor",
    select: "fullName email role profileImage",
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

const ensureMentorUserExists = async (mentorId: string) => {
  assertValidObjectId(mentorId, "Mentor user ID");

  const mentorUser = await User.findById(mentorId).select("_id fullName email role");

  assertFound(mentorUser, "Mentor user not found", 404);

  return mentorUser;
};


type MentorshipProfilePayload = Pick<
  ICreateMentorshipProfile,
  | "bio"
  | "expertise"
  | "availability"
  | "profileImage"
  | "isPrimaryMentor"
  | "yearsOfExperience"
  | "sessionDurationMinutes"
  | "order"
>;

const clearOtherPrimaryMentors = async (
  excludeId?: Types.ObjectId,
  session?: ClientSession,
) => {
  const filter: Record<string, unknown> = {
    isPrimaryMentor: true,
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  await MentorshipProfile.updateMany(
    filter,
    { $set: { isPrimaryMentor: false } },
    session ? { session } : undefined,
  );
};

const createMentorshipProfileRecord = async (
  payload: MentorshipProfilePayload,
  mentorId: Types.ObjectId,
  actorId: string,
  session?: ClientSession,
) => {
  const nextOrder =
    payload.order ??
    (((await MentorshipProfile.findOne({}, { order: 1 })
      .sort({ order: -1 })
      .session(session ?? null)
      .lean())?.order ?? -1) + 1);

  const createData = {
    mentor: mentorId,
    bio: payload.bio,
    expertise: payload.expertise ?? [],
    availability: payload.availability ?? [],
    profileImage: payload.profileImage,
    isPrimaryMentor: payload.isPrimaryMentor ?? false,
    yearsOfExperience: payload.yearsOfExperience,
    sessionDurationMinutes: payload.sessionDurationMinutes ?? 60,
    order: nextOrder,
    status: "draft" as const,
    isActive: true,
    createdBy: new Types.ObjectId(actorId),
  };

  if (createData.isPrimaryMentor) {
    await clearOtherPrimaryMentors(undefined, session);
  }

  const [profile] = await MentorshipProfile.create(
    [createData],
    session ? { session } : undefined,
  );

  assertFound(profile, "Failed to create mentorship profile", 500);

  return profile;
};

const createMentorshipProfile = async (
  payload: ICreateMentorshipProfile,
  actorId: string,
) => {
  await ensureMentorUserExists(payload.mentor);

  const existingProfile = await MentorshipProfile.findOne({
    mentor: payload.mentor,
  });

  if (existingProfile) {
    throwServiceError(
      "A mentorship profile already exists for this mentor",
      409,
    );
  }

  try {
    const profile = await createMentorshipProfileRecord(
      payload,
      new Types.ObjectId(payload.mentor),
      actorId,
    );

    return profile.populate(PROFILE_POPULATE);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "A mentorship profile already exists for this mentor",
        409,
      );
    }

    throw error;
  }
};

const getAllMentorshipProfiles = async ({
  actorRole,
  isActive,
}: {
  actorRole?: string | undefined;
  isActive?: boolean | undefined;
}) => {
  const filter: QueryFilter<IMentorshipProfile> = {};

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
    filter.isActive = true;
  } else if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  return MentorshipProfile.find(filter)
    .sort({ isPrimaryMentor: -1, order: 1, createdAt: 1 })
    .populate(PROFILE_POPULATE).lean();
};

const getPrimaryMentor = async () => {
  const profile = await MentorshipProfile.findOne({
    isPrimaryMentor: true,
    isActive: true,
    status: "published",
  }).populate(PROFILE_POPULATE).lean();

  assertFound(profile, "No primary mentor is currently configured", 404);

  return profile;
};

const getSingleMentorshipProfile = async (
  profileId: string,
  actorRole?: string | undefined,
) => {
  assertValidObjectId(profileId, "Mentorship profile ID");

  const filter: Record<string, unknown> = {
    _id: profileId,
  };

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
    filter.isActive = true;
  }

  const profile = await MentorshipProfile.findOne(filter).populate(
    PROFILE_POPULATE,
  ).lean();

  assertFound(profile, "Mentorship profile not found", 404);

  return profile;
};


const updateMentorshipProfile = async (
  profileId: string,
  payload: IUpdateMentorshipProfile,
  actorId: string,
) => {
  assertValidObjectId(profileId, "Mentorship profile ID");

  const profile = await MentorshipProfile.findById(profileId);

  assertFound(profile, "Mentorship profile not found", 404);

  if (payload.bio !== undefined) {
    profile.bio = payload.bio;
  }

  if (payload.expertise !== undefined) {
    profile.expertise = payload.expertise;
  }

  if (payload.availability !== undefined) {
    profile.availability = payload.availability;
  }

  if (payload.profileImage === null) {
    profile.set("profileImage", undefined);
  } else if (payload.profileImage !== undefined) {
    profile.profileImage = payload.profileImage;
  }

  if (payload.isActive !== undefined) {
    profile.isActive = payload.isActive;
  }

  if (payload.yearsOfExperience !== undefined) {
    profile.yearsOfExperience = payload.yearsOfExperience;
  }

  if (payload.sessionDurationMinutes !== undefined) {
    profile.sessionDurationMinutes = payload.sessionDurationMinutes;
  }

  if (payload.order !== undefined) {
    profile.order = payload.order;
  }

  if (payload.isPrimaryMentor === true) {
    await clearOtherPrimaryMentors(profile._id as Types.ObjectId);
  }

  if (payload.isPrimaryMentor !== undefined) {
    profile.isPrimaryMentor = payload.isPrimaryMentor;
  }

  profile.updatedBy = new Types.ObjectId(actorId);

  await profile.save();

  return profile.populate(PROFILE_POPULATE);
};

const publishMentorshipProfile = async (profileId: string, actorId: string) => {
  assertValidObjectId(profileId, "Mentorship profile ID");

  const profile = await MentorshipProfile.findById(profileId);

  assertFound(profile, "Mentorship profile not found", 404);

  if (profile.status === "archived") {
    throwServiceError("Archived mentorship profile cannot be published", 400);
  }

  profile.status = "published";
  profile.publishedAt = new Date();

  profile.set("archivedAt", undefined);

  profile.updatedBy = new Types.ObjectId(actorId);

  await profile.save();

  return profile.populate(PROFILE_POPULATE);
};

const moveMentorshipProfileToDraft = async (
  profileId: string,
  actorId: string,
) => {
  assertValidObjectId(profileId, "Mentorship profile ID");

  const profile = await MentorshipProfile.findById(profileId);

  assertFound(profile, "Mentorship profile not found", 404);

  if (profile.status === "archived") {
    throwServiceError(
      "Archived mentorship profile cannot be moved to draft",
      400,
    );
  }

  profile.status = "draft";

  profile.set("publishedAt", undefined);

  profile.updatedBy = new Types.ObjectId(actorId);

  await profile.save();

  return profile.populate(PROFILE_POPULATE);
};

const archiveMentorshipProfile = async (
  profileId: string,
  actorId: string,
) => {
  assertValidObjectId(profileId, "Mentorship profile ID");

  const profile = await MentorshipProfile.findById(profileId);

  assertFound(profile, "Mentorship profile not found", 404);

  profile.status = "archived";
  profile.archivedAt = new Date();

  profile.isActive = false;
  profile.isPrimaryMentor = false;

  profile.set("publishedAt", undefined);

  profile.updatedBy = new Types.ObjectId(actorId);

  await profile.save();

  return profile.populate(PROFILE_POPULATE);
};

const MENTOR_FIELD_POPULATE = {
  path: "mentor",
  select: "fullName email role profileImage",
};

/**
 * Member self-selects their co_mentor from the published, non-primary
 * mentorship profiles (e.g. at purchase/onboarding time). The primary
 * mentor is global and not selectable here.
 */
const selectMyCoMentor = async (
  memberUserId: string,
  mentorshipProfileId: string,
) => {
  assertValidObjectId(memberUserId, "Member user ID");
  assertValidObjectId(mentorshipProfileId, "Mentorship profile ID");

  const member = await User.findById(memberUserId)
    .select("_id fullName email role assignedCoMentorProfile coMentorAssignedAt")
    .lean();

  assertFound(member, "Member not found", 404);

  if (member.assignedCoMentorProfile) {
    throwServiceError(
      "Your co_mentor has already been selected and cannot be changed",
      409,
    );
  }

  const profile = await MentorshipProfile.findOne({
    _id: mentorshipProfileId,
    status: "published",
    isActive: true,
  })
    .populate(MENTOR_FIELD_POPULATE)
    .lean();

  assertFound(
    profile,
    "Mentorship profile not found or not available for selection",
    404,
  );

  if (profile.isPrimaryMentor) {
    throwServiceError(
      "The primary mentor is assigned automatically and cannot be selected as a co_mentor",
      400,
    );
  }

  if (!profile.mentor) {
    throwServiceError(
      "This mentorship profile is not assigned to a mentor",
      400,
    );
  }

  if (String(profile.mentor._id) === memberUserId) {
    throwServiceError(
      "You cannot select yourself as your own co_mentor",
      400,
    );
  }

  const updatedMember = await User.findOneAndUpdate(
    {
      _id: memberUserId,
      assignedCoMentorProfile: { $exists: false },
    },
    {
      assignedCoMentorProfile: profile._id,
      coMentorAssignedAt: new Date(),
      coMentorAssignedBy: new Types.ObjectId(memberUserId),
    },
    { new: true },
  );

  if (!updatedMember) {
    throwServiceError(
      "Your co_mentor has already been selected and cannot be changed",
      409,
    );
  }

  return profile;
};
/**
 * Fetch the member's currently selected co_mentor (if any).
 */
const getMyCoMentor = async (memberUserId: string) => {
  assertValidObjectId(memberUserId, "Member user ID");

  const member = await User.findById(memberUserId)
    .select("_id assignedCoMentorProfile coMentorAssignedAt")
    .populate({
      path: "assignedCoMentorProfile",
      populate: MENTOR_FIELD_POPULATE,
    })
    .lean();

  assertFound(member, "Member not found", 404);

  return member;
};

const getAvailabilityForProfileOwner = async (
  userId: string,
  actorRole?: string,
) => {
  assertValidObjectId(userId, "User ID");

  const profile =
    actorRole === "founder"
      ? await MentorshipProfile.findOne({ isPrimaryMentor: true })
      : await MentorshipProfile.findOne({
          mentor: new Types.ObjectId(userId),
          isPrimaryMentor: true,
        });

  assertFound(
    profile,
    actorRole === "founder"
      ? "No primary mentor profile is configured"
      : "You are not the primary mentor",
    404,
  );

  return {
    profileId: profile._id,
    mentor: profile.mentor,
    availability: profile.availability,
  };
};

const updatePrimaryMentorAvailability = async (
  userId: string,
  actorRole: string | undefined,
  availability: ICreateMentorshipProfile["availability"],
) => {
  const current = await getAvailabilityForProfileOwner(userId, actorRole);

  const profile = await MentorshipProfile.findByIdAndUpdate(
    current.profileId,
    { $set: { availability: availability ?? [] } },
    { new: true, runValidators: true },
  );

  assertFound(profile, "Primary mentor profile not found", 404);

  return profile.availability;
};


import { hashPassword } from "../../utility/passwordUtil";

const createMentor = async (
  payload: ICreateMentorInput,
  actorId: string,
) => {
  assertValidObjectId(actorId, "Actor user ID");

  const session = await MentorshipProfile.startSession();

  try {
    let createdProfileId: Types.ObjectId | null = null;

    await session.withTransaction(async () => {
      let mentorUser: MentorUserDoc | undefined;

      if (payload.mode === "create") {


        const email = payload.email.toLowerCase().trim();
        const fullName = payload.fullName.trim();

        const existingUser = await User.findOne({ email })
          .select("_id")
          .session(session)
          .lean();

        if (existingUser) {
          throwServiceError("A user with this email already exists", 409);
        }

        const hashedPassword = await hashPassword(payload.password);

        const [createdUser] = await User.create(
          [
            {
              fullName,
              email,
              password: hashedPassword,
              role: "co_mentor",
              accessTo: "both",
              paymentStatus: "paid",
              subscriptionStatus: "active",
              approvalStatus: "approved",
              accountStatus: "active",
              licenseVerificationStatus: "verified",
              approvedBy: new Types.ObjectId(actorId),
            },
          ],
          { session },
        );

        mentorUser = createdUser as MentorUserDoc;
      } else if (payload.mode === "existing") {
        const userId = payload.userId;
        assertValidObjectId(userId, "User ID");

        const foundUser = await User.findById(userId)
          .select("_id fullName email role")
          .session(session);

        assertFound(foundUser, "User not found", 404);

        mentorUser = foundUser as MentorUserDoc;

        // Give the existing user mentor role
        mentorUser.role = "co_mentor";
        await mentorUser.save({ session });
      }

      assertFound(mentorUser, "Failed to resolve mentor user", 500);

      /**
       * =========================================================
       * CHECK EXISTING MENTORSHIP PROFILE
       * =========================================================
       */
      const existingProfile = await MentorshipProfile.findOne({
        mentor: mentorUser._id,
      })
        .session(session)
        .lean();

      if (existingProfile) {
        throwServiceError("This user already has a mentorship profile", 409);
      }

      const profile = await createMentorshipProfileRecord(
        payload,
        mentorUser._id,
        actorId,
        session,
      );
      createdProfileId = profile._id as Types.ObjectId;
    });

    /**
     * =========================================================
     * FETCH FINAL RESULT
     * =========================================================
     */
    assertFound(createdProfileId, "Failed to create mentor", 500);

    const result = await MentorshipProfile.findById(createdProfileId)
      .populate(PROFILE_POPULATE)
      .lean();

    assertFound(result, "Mentor profile not found after creation", 500);

    return result;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "A user or mentorship profile with the provided information already exists",
        409,
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

export const mentorshipProfileService = {
  createMentorshipProfile,
  createMentor,

  getAllMentorshipProfiles,
  getPrimaryMentor,
  getSingleMentorshipProfile,

  updateMentorshipProfile,

  publishMentorshipProfile,
  moveMentorshipProfileToDraft,
  archiveMentorshipProfile,

  selectMyCoMentor,
  getMyCoMentor,
  getAvailabilityForProfileOwner,
  updatePrimaryMentorAvailability,
};