import { QueryFilter, Types } from "mongoose";

import assertFound from "../../utility/assertFound";
import { User } from "../users/users.model.schema";

import {
  ICreateStreakLogInput,
  IStreakLog,
  IStreakLogQuery,
} from "./streaklog.interface";
import { StreakLog } from "./streaklog.model.schema";

const normalizeDateString = (input: string | Date, timezone = "UTC") => {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid activityDate");
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const formatted = formatter.format(date);
  const [year, month, day] = formatted.split("-");

  return `${year}-${month}-${day}`;
};

const getDateFromNormalized = (normalizedDate: string) =>
  new Date(`${normalizedDate}T00:00:00.000Z`);

const syncStreaksForUser = async (userId: string) => {
  const entries = await StreakLog.find({ user: new Types.ObjectId(userId) })
    .sort({ normalizedDate: 1 })
    .lean();

  if (entries.length === 0) {
    return;
  }

  let currentStreakDays = 0;
  let longestStreakDays = 0;
  let previousDate: Date | null = null;

  for (const entry of entries) {
    const currentDate = getDateFromNormalized(entry.normalizedDate);

    if (previousDate && currentDate.getTime() - previousDate.getTime() === 86400000) {
      currentStreakDays += 1;
    } else {
      currentStreakDays = 1;
    }

    longestStreakDays = Math.max(longestStreakDays, currentStreakDays);
    previousDate = currentDate;

    await StreakLog.findByIdAndUpdate(
      entry._id,
      {
        currentStreakDays,
        longestStreakDays,
        lastActivityDate: currentDate,
      },
      { runValidators: true },
    );
  }

  await StreakLog.updateMany(
    { user: new Types.ObjectId(userId) },
    {
      currentStreakDays,
      longestStreakDays,
      lastActivityDate: previousDate ?? undefined,
    },
    { runValidators: true },
  );
};

const createStreakLog = async (payload: ICreateStreakLogInput) => {
  const user = await User.findById(payload.user).select("_id");
  assertFound(user, "User not found", 404);

  if (payload.academyProfile) {
    const academyProfile = await User.findById(payload.academyProfile).select("_id");
    assertFound(academyProfile, "Academy profile not found", 404);
  }

  const timezone = payload.timezone ?? "UTC";
  const normalizedDate = normalizeDateString(payload.activityDate, timezone);
  const activityDateValue = getDateFromNormalized(normalizedDate);

  const existing = await StreakLog.findOne({
    user: new Types.ObjectId(payload.user),
    normalizedDate,
  }).select("_id");

  if (existing) {
    throw new Error("A streak log already exists for this user and date");
  }

  const log = await StreakLog.create({
    user: new Types.ObjectId(payload.user),
    academyProfile: payload.academyProfile
      ? new Types.ObjectId(payload.academyProfile)
      : undefined,
    activityDate: activityDateValue,
    normalizedDate,
    timezone,
    activityType: payload.activityType ?? "manual",
    activityCount: payload.activityCount ?? 1,
    currentStreakDays: 1,
    longestStreakDays: 1,
    lastActivityDate: activityDateValue,
  });

  await syncStreaksForUser(payload.user);

  return log;
};

const getStreakLogs = async (query: IStreakLogQuery) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IStreakLog> = {};

  if (query.userId) {
    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.academyProfileId) {
    filter.academyProfile = new Types.ObjectId(query.academyProfileId);
  }

  if (query.timezone) {
    filter.timezone = query.timezone;
  }

  if (query.fromDate || query.toDate) {
    filter.normalizedDate = {} as Record<string, string>;

    if (query.fromDate) {
      (filter.normalizedDate as Record<string, string>).$gte = query.fromDate;
    }

    if (query.toDate) {
      (filter.normalizedDate as Record<string, string>).$lte = query.toDate;
    }
  }

  const [data, total] = await Promise.all([
    StreakLog.find(filter)
      .populate("user", "fullName email role")
      .populate("academyProfile", "fullName companyName")
      .sort({ normalizedDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StreakLog.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleStreakLog = async (streakLogId: string) => {
  const log = await StreakLog.findById(streakLogId)
    .populate("user", "fullName email role")
    .populate("academyProfile", "fullName companyName")
    .lean();

  assertFound(log, "Streak log not found", 404);

  return log;
};

/**
 * Idempotent "count today as active" helper.
 *
 * Call this from anywhere a daily-activity streak should be kept
 * alive — login, watching a video, etc. Unlike createStreakLog this
 * never throws if today's entry already exists; it just returns the
 * existing state. One calendar day (per `timezone`) = one streak
 * tick. Missing a day breaks the streak back down to 1 the next
 * time the user shows up (handled by syncStreaksForUser's gap check).
 */
const recordDailyActivity = async (
  userId: string,
  activityType: ICreateStreakLogInput["activityType"] = "login",
  timezone: ICreateStreakLogInput["timezone"] = "UTC",
) => {
  const normalizedDate = normalizeDateString(new Date(), timezone);

  const existing = await StreakLog.findOne({
    user: new Types.ObjectId(userId),
    normalizedDate,
  });

  let currentStreakDays: number;

  if (existing) {
    existing.activityCount += 1;
    await existing.save();
    currentStreakDays = existing.currentStreakDays;
  } else {
    const created = await createStreakLog({
      user: userId,
      activityDate: normalizedDate,
      timezone,
      activityType,
    });

    currentStreakDays = created.currentStreakDays;
  }

  try {
    const { Leaderboard } = await import("../leaderboards/leaderboard.model.schema");
    const { leaderboardEntryService } = await import(
      "../leaderboardEntries/leaderboard.entry.service"
    );

    const activeLeaderboards = await Leaderboard.find({
      type: "points",
      status: "active",
    })
      .select("_id")
      .lean();

    await Promise.all(
      activeLeaderboards.map((leaderboard) =>
        leaderboardEntryService.setBreakdownField(leaderboard._id.toString(), {
          userId,
          breakdownKey: "streak",
          value: currentStreakDays,
        }),
      ),
    );
  } catch {
    // Streak tracking itself must never fail because a leaderboard
    // snapshot couldn't be updated.
  }

  return { normalizedDate, currentStreakDays, alreadyLoggedToday: Boolean(existing) };
};

export const streakLogService = {
  createStreakLog,
  getStreakLogs,
  getSingleStreakLog,
  syncStreaksForUser,
  recordDailyActivity,
};