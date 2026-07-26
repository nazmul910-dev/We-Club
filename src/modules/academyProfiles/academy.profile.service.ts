import { Types, QueryFilter } from "mongoose";

import { AcademyProfile } from "./academy.profile.model.schema";

import { IAcademyProfile } from "./academy.profile.interface";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};



function assertFound<T>(
  value: T | null | undefined,
  message: string,
  statusCode: number
): asserts value is T {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
}

const createProfile = async (
  userId: string,
  payload: Partial<IAcademyProfile>,
) => {
  const existing = await AcademyProfile.findOne({
    user: userId,
  });

  if (existing) {
    throwServiceError("Academy profile already exists", 409);
  }

  const profile = await AcademyProfile.create({
    user: new Types.ObjectId(userId),

    ...payload,
  });

  return profile;
};

const getMyProfile = async (userId: string) => {
  const filter: QueryFilter<IAcademyProfile> = {
    user: new Types.ObjectId(userId),
  };

  const profile = await AcademyProfile.findOne(filter)
    .populate("currentPillar", "name slug title")
    .populate("mentor", "fullName email profileImage");

  assertFound(profile, "Academy profile not found", 404);

  return profile;
};

const updateProfile = async (
  userId: string,

  payload: Partial<IAcademyProfile>,
) => {
  const profile = await AcademyProfile.findOne({
    user: new Types.ObjectId(userId),
  });

  assertFound(profile, "Academy profile not found", 404);

  if (payload.academyName !== undefined)
    profile.academyName = payload.academyName;

  if (payload.bio !== undefined) profile.bio = payload.bio;

  if (payload.goals !== undefined) profile.goals = payload.goals;

  if (payload.experienceLevel !== undefined)
    profile.experienceLevel = payload.experienceLevel;

  if (payload.notificationPreferences !== undefined) {
    profile.notificationPreferences = {
      ...profile.notificationPreferences,
      ...payload.notificationPreferences,
    };
  }

  await profile.save();

  return profile;
};

const getAllProfiles = async () => {
  return AcademyProfile.find()

    .populate("user", "fullName email role profileImage")

    .populate("mentor", "fullName email")

    .populate("currentPillar", "title slug");
};

export const academyProfileService = {
  createProfile,

  getMyProfile,

  updateProfile,

  getAllProfiles,
};
