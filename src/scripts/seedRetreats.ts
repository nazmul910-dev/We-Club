import bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";

import config from "../config";
import { User } from "../modules/users/users.model.schema";
import { RetreatLocation } from "../modules/retreatLocations/retreat.location.model.schema";
import { RetreatBatch } from "../modules/retreatBatches/retreat.batch.model.schema";
import { RetreatBooking } from "../modules/retreatBookings/retreat.booking.model.schema";

const SEED_PREFIX = "retreat-seed";
const SEED_PASSWORD = "SeedPassword123!";

const retreatPlaces = [
  ["Costa Rica Nature Retreat", "Nosara", "Costa Rica"],
  ["Marrakech Leadership Retreat", "Marrakech", "Morocco"],
  ["Amalfi Strategy Escape", "Amalfi", "Italy"],
  ["Swiss Alps Executive Reset", "Zermatt", "Switzerland"],
  ["Lisbon Founders Residency", "Lisbon", "Portugal"],
  ["Bali Conscious Leadership", "Ubud", "Indonesia"],
  ["Patagonia Vision Retreat", "El Chalten", "Argentina"],
  ["Kyoto Mastery Retreat", "Kyoto", "Japan"],
  ["Iceland Clarity Retreat", "Reykjavik", "Iceland"],
  ["Seychelles Ocean Reset", "Mahe", "Seychelles"],
  ["Barcelona Growth Intensive", "Barcelona", "Spain"],
  ["Dubai Dealmakers Retreat", "Dubai", "United Arab Emirates"],
  ["Cape Town Impact Retreat", "Cape Town", "South Africa"],
  ["Queenstown Adventure Summit", "Queenstown", "New Zealand"],
  ["Paris Inner Circle Retreat", "Paris", "France"],
  ["Mexico Wellness Residency", "Tulum", "Mexico"],
  ["Greek Islands Strategy Week", "Paros", "Greece"],
  ["Norwegian Fjord Reset", "Bergen", "Norway"],
  ["Vancouver Executive Retreat", "Vancouver", "Canada"],
  ["Maldives Blue Horizon Retreat", "Male", "Maldives"],
] as const;

const galleryImages = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
];

const createSeedUsers = async () => {
  const password = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = [];

  for (const [index, [fullName, country]] of retreatPlaces.entries()) {
    const email = `${SEED_PREFIX}-${index + 1}@example.com`;
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          fullName: `Retreat Guest ${index + 1}`,
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

const createSeedLocations = async (ownerId: Types.ObjectId) => {
  const locations = [];

  for (const [index, [title, city, country]] of retreatPlaces.entries()) {
    const slug = `${SEED_PREFIX}-${index + 1}`;
    const location = await RetreatLocation.findOneAndUpdate(
      { slug },
      {
        $set: {
          title,
          slug,
          country,
          city,
          tagline: "A focused week to reset, connect, and move forward.",
          description: `A curated retreat in ${city}, ${country}, designed for meaningful conversations, clear thinking, and practical personal growth.`,
          coverImage: galleryImages[index % galleryImages.length],
          promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          galleryImages,
          whatsIncluded: [
            "Daily guided sessions",
            "Private community dinners",
            "Local cultural experience",
            "Wellness and reflection time",
          ],
          isFeatured: index === 0,
          isActive: true,
          status: "published",
          order: index + 1,
          createdBy: ownerId,
          updatedBy: ownerId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (!location) throw new Error(`Could not create location: ${slug}`);
    locations.push(location);
  }

  return locations;
};

const createSeedBatchesAndBookings = async (
  locations: Awaited<ReturnType<typeof createSeedLocations>>,
  users: Awaited<ReturnType<typeof createSeedUsers>>,
  ownerId: Types.ObjectId,
) => {
  let bookingCount = 0;

  for (const [index, location] of locations.entries()) {
    const batchSlug = `${SEED_PREFIX}-batch-${index + 1}`;
    const startDate = new Date(Date.UTC(2026, 9, 12 + index * 3));
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 5);
    const guest = users[index];

    if (!guest) throw new Error(`Missing guest for batch ${batchSlug}`);

    const batch = await RetreatBatch.findOneAndUpdate(
      { slug: batchSlug },
      {
        $set: {
          retreatLocation: location._id,
          batchName: `${location.title} · October 2026`,
          slug: batchSlug,
          startDate,
          endDate,
          capacity: 20 + index,
          confirmedBookingsCount: 1,
          waitlistCount: 0,
          price: 3200 + index * 150,
          depositAmount: 800 + index * 25,
          currency: "usd",
          status: "open",
          isFeatured: index === 0,
          isActive: true,
          bookingDeadline: new Date(Date.UTC(2026, 8, 20 + index)),
          description: `Five nights of guided work and connection in ${location.city}.`,
          notes: "Seed data for local development.",
          createdBy: ownerId,
          updatedBy: ownerId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (!batch) throw new Error(`Could not create batch: ${batchSlug}`);

    await RetreatBooking.findOneAndUpdate(
      { user: guest._id, retreatBatch: batch._id },
      {
        $set: {
          user: guest._id,
          retreatBatch: batch._id,
          retreatLocation: location._id,
          status: "confirmed",
          amount: batch.price,
          amountPaid: batch.price,
          currency: "usd",
          paidAt: new Date(),
          confirmedAt: new Date(),
          notes: "Seed booking for local development.",
          createdBy: ownerId,
          updatedBy: ownerId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    bookingCount += 1;
  }

  return bookingCount;
};

const main = async () => {
  if (!config.MONGO_URI) throw new Error("MONGO_URI is not configured");

  await mongoose.connect(config.MONGO_URI);

  try {
    const users = await createSeedUsers();
    const owner = users[0];
    if (!owner) throw new Error("No seed owner was created");

    const locations = await createSeedLocations(owner._id);
    const bookingCount = await createSeedBatchesAndBookings(
      locations,
      users,
      owner._id,
    );

    // console.log(
    //   `Seeded ${users.length} users, ${locations.length} retreat locations, ${locations.length} retreat batches, and ${bookingCount} retreat bookings.`,
    // );
    // console.log(`Seed login password: ${SEED_PASSWORD}`);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error("Retreat seed failed:", error);
  process.exitCode = 1;
});
