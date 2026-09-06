import { Room } from "./room.modal";
import { resolveCountry } from "../../utility/country";
import { Types } from "mongoose";
import { User } from "../users/users.model.schema";
import { CountryRoomRequest } from "./country.room.request.model";
import type { CountryRoomRequestStatus } from "./country.room.request.interface";

export const PRIVATE_ROOM_DEFINITIONS = [
  { slug: "ceos-council-club", name: "CEOs Council Club" },
  { slug: "founders-council-club", name: "Founders Council Club" },
  { slug: "vip-community", name: "VIP Community" },
  { slug: "world-elite-inner-circle", name: "World Elite Inner Circle" },
] as const;

export const ensurePrivateRooms = async (createdBy: string) => {
  await Promise.all(
    PRIVATE_ROOM_DEFINITIONS.map(({ slug, name }) =>
      Room.findOneAndUpdate(
        { slug, type: "private" },
        {
          $setOnInsert: {
            slug,
            name,
            type: "private",
            members: [],
            createdBy: new Types.ObjectId(createdBy),
          },
        },
        { upsert: true, new: true },
      ),
    ),
  );
};

export const canAccessEveryPrivateRoom = (role?: string): boolean =>
  role === "founder"  || role === "manager";

export const getPrivateRoomsForUser = async (userId: string, role?: string) => {
  const rooms = await Room.find({ type: "private" })
    .select("slug name members")
    .lean();

  const canAccessAll = canAccessEveryPrivateRoom(role);

  return PRIVATE_ROOM_DEFINITIONS.map((definition) => {
    const room = rooms.find((item) => item.slug === definition.slug);

    return {
      slug: definition.slug,
      name: room?.name ?? definition.name,
      canEnter:
        canAccessAll ||
        Boolean(room?.members.some((member) => String(member) === userId)),
    };
  });
};

export const getPrivateRoom = async (
  slug: string,
  userId: string,
  role?: string,
) => {
  const room = await Room.findOne({ slug, type: "private" }).lean();
  if (!room) throw new Error("Private community room not found");
  if (
    !canAccessEveryPrivateRoom(role) &&
    !room.members.some((member) => String(member) === userId)
  ) {
    throw new Error("You are not a member of this private community room");
  }
  return room;
};

export const addPrivateRoomMember = async (slug: string, userId: string) => {
  const room = await Room.findOneAndUpdate(
    { slug, type: "private" },
    { $addToSet: { members: new Types.ObjectId(userId) } },
    { new: true },
  );
  if (!room) throw new Error("Private community room not found");
  return room;
};

export const getGeneralRoom = async (createdBy: string) => {
  return Room.findOneAndUpdate(
    { type: "general" },
    {
      $setOnInsert: {
        name: "General Community",
        createdBy,
        type: "general",
      },
    },
    { upsert: true, new: true },
  );
};

export const getOrCreateCountryRoom = async (
  countryName: string,
  createdBy: string,
) => {
  const country = resolveCountry(countryName);

  if (!country) {
    throw new Error("Invalid country name");
  }

  return Room.findOneAndUpdate(
    { countryCode: country.code, type: "country" },
    {
      $setOnInsert: {
        name: `${country.name} Community`,
        createdBy,
        countryCode: country.code,
        countryName: country.name,
        type: "country",
      },
    },
    { upsert: true, new: true },
  );
};

const isPrivilegedCountryRoomRole = (role?: string) =>
  role === "founder" || role === "manager";

const resolveCountryRoom = async (countryName: string, createdBy: string) => {
  const country = resolveCountry(countryName);
  if (!country) throw new Error("Invalid country name");

  const room = await getOrCreateCountryRoom(country.name, createdBy);
  return { country, room };
};

export const getCountryRoomAccess = async (
  userId: string,
  role: string | undefined,
  countryName: string,
) => {
  const { country, room } = await resolveCountryRoom(countryName, userId);
  const user = await User.findById(userId).select("country").lean();
  const userCountry = user?.country ? resolveCountry(user.country) : null;
  const canEnter =
    isPrivilegedCountryRoomRole(role) ||
    userCountry?.code === country.code ||
    room.members.some((member) => String(member) === userId);
  const request = await CountryRoomRequest.findOne({
    user: userId,
    room: room._id,
  }).lean();

  return {
    countryName: country.name,
    countryCode: country.code,
    canEnter,
    requestStatus: request?.status ?? null,
    requestId: request?._id ?? null,
  };
};

export const createCountryRoomRequest = async (
  userId: string,
  countryName: string,
) => {
  const { country, room } = await resolveCountryRoom(countryName, userId);
  const existingMembership = room.members.some(
    (member) => String(member) === userId,
  );
  if (existingMembership) throw new Error("You already have access to this room");

  const existing = await CountryRoomRequest.findOne({
    user: userId,
    room: room._id,
  });
  if (existing?.status === "pending") return existing;
  if (existing?.status === "rejected") {
    existing.status = "pending";
    existing.set("reviewedBy", undefined);
    existing.set("reviewedAt", undefined);
    await existing.save();
    return existing;
  }

  return CountryRoomRequest.create({
    user: new Types.ObjectId(userId),
    room: room._id,
    countryName: country.name,
    countryCode: country.code,
    status: "pending",
  });
};

export const getMyCountryRoomRequests = async (userId: string) =>
  CountryRoomRequest.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

export const getCountryRoomRequestsForReview = async () =>
  CountryRoomRequest.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("user", "fullName email role country")
    .populate("room", "name countryName countryCode")
    .lean();

export const reviewCountryRoomRequest = async (
  requestId: string,
  reviewerId: string,
  status: Extract<CountryRoomRequestStatus, "approved" | "rejected">,
) => {
  if (!Types.ObjectId.isValid(requestId)) throw new Error("Invalid request ID");

  const request = await CountryRoomRequest.findById(requestId);
  if (!request) throw new Error("Country room request not found");
  if (request.status !== "pending") throw new Error("This request was already reviewed");

  request.status = status;
  request.reviewedBy = new Types.ObjectId(reviewerId);
  request.reviewedAt = new Date();
  await request.save();

  if (status === "approved") {
    await Room.findByIdAndUpdate(request.room, {
      $addToSet: { members: request.user },
    });
  }

  return request.populate([
    { path: "user", select: "fullName email role country" },
    { path: "room", select: "name countryName countryCode" },
  ]);
};