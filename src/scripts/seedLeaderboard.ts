import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";

import config from "../config";
import { User } from "../modules/users/users.model.schema";
import { Leaderboard } from "../modules/leaderboards/leaderboard.model.schema";
import { LeaderboardEntry } from "../modules/leaderboardEntries/leaderboard.entry.model.schema";
import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_TYPES,
} from "../modules/leaderboards/leaderboard.interface";

const SEED_PREFIX = "leaderboard-seed";
const SEED_PASSWORD = "SeedPassword123!";

const fakeMembers = [
  ["Nathalie Rousseau", "nathalie.rousseau", "France"],
  ["David Chen", "david.chen", "Canada"],
  ["Alexander Marchetti", "alexander.marchetti", "Italy"],
  ["Priya Anand", "priya.anand", "United States"],
  ["Luis Ortega", "luis.ortega", "Mexico"],
  ["Sofia Almeida", "sofia.almeida", "Portugal"],
  ["Hannah Weiss", "hannah.weiss", "Spain"],
  ["Youssef Bennani", "youssef.bennani", "Canada"],
  ["Emma Laurent", "emma.laurent", "France"],
  ["Michael Brooks", "michael.brooks", "United States"],
  ["Giulia Romano", "giulia.romano", "Italy"],
  ["Rafael Santos", "rafael.santos", "Portugal"],
  ["Camila Torres", "camila.torres", "Mexico"],
  ["Oliver Smith", "oliver.smith", "United Kingdom"],
  ["Ava Martin", "ava.martin", "France"],
  ["Noah Wilson", "noah.wilson", "Canada"],
  ["Mia Garcia", "mia.garcia", "Spain"],
  ["Ethan Taylor", "ethan.taylor", "United States"],
  ["Ines Costa", "ines.costa", "Portugal"],
  ["Daniel Kim", "daniel.kim", "Canada"],
] as const;

const createSeedUsers = async () => {
  const password = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = [];

  for (const [index, [fullName, username, country]] of fakeMembers.entries()) {
    const email = `${username}@example.com`;
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          fullName,
          role: "we_club_member",
          accessTo: "invictus",
          country,
          city: "Seed City",
          password,
          membershipAccessStatus: "active",
          paymentStatus: "paid",
          approvalStatus: "approved",
          accountStatus: "active",
          licenseVerificationStatus: "verified",
          subscriptionStatus: "active",
          discretionScore: 80 + (index % 20),
        },
        $setOnInsert: { email },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (!user) throw new Error(`Could not create seed user: ${email}`);
    users.push(user);
  }

  return users;
};

const createSeedLeaderboards = async (ownerId: Types.ObjectId) => {
  const leaderboards = [];
  const now = new Date();
  const startAt = new Date(now);
  startAt.setDate(startAt.getDate() - 30);
  const endAt = new Date(now);
  endAt.setDate(endAt.getDate() + 60);

  for (let index = 0; index < 20; index += 1) {
    const type = LEADERBOARD_TYPES[Math.floor(index / LEADERBOARD_PERIODS.length)];
    const period = LEADERBOARD_PERIODS[index % LEADERBOARD_PERIODS.length];
    const title = `${SEED_PREFIX}-${index + 1}-${type}-${period}`;

    const leaderboard = await Leaderboard.findOneAndUpdate(
      { title },
      {
        $set: {
          title,
          type,
          period,
          startAt,
          endAt,
          status: "active",
          description: `Seed leaderboard ${index + 1} for local development.`,
          createdBy: ownerId,
          updatedBy: ownerId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    leaderboards.push(leaderboard);
  }

  return leaderboards;
};

const createSeedEntries = async (
  leaderboards: Awaited<ReturnType<typeof createSeedLeaderboards>>,
  users: Awaited<ReturnType<typeof createSeedUsers>>,
) => {
  let entryCount = 0;

  for (const [leaderboardIndex, leaderboard] of leaderboards.entries()) {
    const operations = users.map((user, userIndex) => {
      const points = 2840 - userIndex * 43 - leaderboardIndex * 7;
      const modules = Math.max(1, 18 - userIndex);
      const success = Math.max(50, 96 - userIndex);
      const streak = Math.max(1, 42 - userIndex * 2);

      return {
        updateOne: {
          filter: { leaderboard: leaderboard._id, user: user._id },
          update: {
            $set: {
              rank: userIndex + 1,
              points,
              breakdown: {
                modules,
                success,
                streak,
              },
              lastUpdatedAt: new Date(),
            },
            $setOnInsert: {
              leaderboard: leaderboard._id,
              user: user._id,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await LeaderboardEntry.bulkWrite(operations);
    entryCount += result.upsertedCount + result.modifiedCount;
  }

  return entryCount;
};

const main = async () => {
  if (!config.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(config.MONGO_URI);

  try {
    const users = await createSeedUsers();
    const owner = users[0];
    if (!owner) throw new Error("No seed owner was created");

    const leaderboards = await createSeedLeaderboards(owner._id);
    const entryCount = await createSeedEntries(leaderboards, users);

    // console.log(
    //   `Seeded ${users.length} users, ${leaderboards.length} leaderboards, and ${entryCount} leaderboard entries.`,
    // );
    // console.log(`Seed login password: ${SEED_PASSWORD}`);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error("Leaderboard seed failed:", error);
  process.exitCode = 1;
});
