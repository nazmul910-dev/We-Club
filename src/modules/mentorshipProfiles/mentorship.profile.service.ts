import { QueryFilter, Types } from "mongoose";

import { User } from "../users/users.model.schema";

import {
  ICreateMentorshipProfile,
  IMentorshipProfile,
  IUpdateMentorshipProfile,
} from "./mentorship.profile.interface";

import { MentorshipProfile } from "./mentorship.profile.model.schema";

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
  return role === "admin" || role === "manager";
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


const clearOtherPrimaryMentors = async (excludeId?: Types.ObjectId) => {
  const filter: Record<string, unknown> = {
    isPrimaryMentor: true,
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  await MentorshipProfile.updateMany(filter, {
    $set: { isPrimaryMentor: false },
  });
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

  const createData: Record<string, unknown> = {
    mentor: new Types.ObjectId(payload.mentor),

    bio: payload.bio,

    expertise: payload.expertise ?? [],

    availability: payload.availability ?? [],

    isPrimaryMentor: payload.isPrimaryMentor ?? false,

    sessionDurationMinutes: payload.sessionDurationMinutes ?? 60,

    order: payload.order ?? 0,

    status: "draft",

    createdBy: new Types.ObjectId(actorId),
  };

  if (payload.profileImage !== undefined) {
    createData.profileImage = payload.profileImage;
  }

  if (payload.yearsOfExperience !== undefined) {
    createData.yearsOfExperience = payload.yearsOfExperience;
  }

  try {
    const profile = await MentorshipProfile.create(createData);

    if (profile.isPrimaryMentor) {
      await clearOtherPrimaryMentors(profile._id as Types.ObjectId);
    }

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

  if (payload.isPrimaryMentor !== undefined) {
    profile.isPrimaryMentor = payload.isPrimaryMentor;
  }

  profile.updatedBy = new Types.ObjectId(actorId);

  await profile.save();

  if (profile.isPrimaryMentor) {
    await clearOtherPrimaryMentors(profile._id as Types.ObjectId);
  }

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
 * Member self-selects their co-mentor from the published, non-primary
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
    .select("_id fullName email role")
    .lean();

  assertFound(member, "Member not found", 404);

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
      "The primary mentor is assigned automatically and cannot be selected as a co-mentor",
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
      "You cannot select yourself as your own co-mentor",
      400,
    );
  }

  await User.findByIdAndUpdate(
    memberUserId,
    {
      assignedCoMentorProfile: profile._id,
      coMentorAssignedAt: new Date(),
      coMentorAssignedBy: new Types.ObjectId(memberUserId),
    },
    { new: true },
  );

  return profile;
};
/**
 * Fetch the member's currently selected co-mentor (if any).
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

export const mentorshipProfileService = {
  createMentorshipProfile,

  getAllMentorshipProfiles,
  getPrimaryMentor,
  getSingleMentorshipProfile,

  updateMentorshipProfile,

  publishMentorshipProfile,
  moveMentorshipProfileToDraft,
  archiveMentorshipProfile,

  selectMyCoMentor,
  getMyCoMentor,
};