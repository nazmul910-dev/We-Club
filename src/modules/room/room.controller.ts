import { Request, Response, NextFunction } from "express";
import { User } from "../users/users.model.schema";
import { resolveCountry } from "../../utility/country";

import {
  getGeneralRoom,
  getOrCreateCountryRoom as getOrCreateCountryRoomService,
  addPrivateRoomMember,
  getPrivateRoom,
  getPrivateRoomsForUser,
  PRIVATE_ROOM_DEFINITIONS,
  ensurePrivateRooms,
  createCountryRoomRequest,
  getMyCountryRoomRequests,
  getCountryRoomRequestsForReview,
  reviewCountryRoomRequest,
  getCountryRoomAccess,
} from "./room.service";
import sendCustomMail from "../../utility/sendCustomMail";
import config from "../../config";

export const getPrivateRoomsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rooms = await getPrivateRoomsForUser(
      String(req.user?.id ?? ""),
      String(req.user?.role ?? ""),
    );

    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

export const getPrivateRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = String(req.user?.id ?? "");
    const room = await getPrivateRoom(
      String(req.params.slug),
      userId,
      String(req.user?.role ?? ""),
    );
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

export const invitePrivateRoomMemberHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await ensurePrivateRooms(String(req.user?.id ?? req.params.userId));
    const target = await User.findById(req.params.userId).select("fullName email").lean();
    if (!target) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const definition = PRIVATE_ROOM_DEFINITIONS.find(
      (room) => room.slug === req.params.slug,
    );
    if (!definition) {
      res.status(404).json({ success: false, message: "Private room not found" });
      return;
    }

    await addPrivateRoomMember(definition.slug, target._id.toString());
    const link = `${config.FRONTEND_URL}/invictus/community-rooms/private?room=${encodeURIComponent(definition.slug)}`;

    await sendCustomMail({
      to: target.email,
      subject: `Invitation to ${definition.name}`,
      text: `You have been invited to ${definition.name}: ${link}`,
      html: `<p>Hello ${target.fullName},</p><p>You have been invited to join <strong>${definition.name}</strong>.</p><p><a href="${link}">Open the private community room</a></p><p>Sign in to Invictus first if required.</p>`,
    });

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${target.email}`,
      data: { room: definition, link },
    });
  } catch (error) {
    next(error);
  }
};

export const getGeneralRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const room = await getGeneralRoom(userId as string);

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const getCountryRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const countryName = req.query.countryName;

    if (typeof countryName !== "string" || !countryName.trim()) {
      res.status(400).json({
        success: false,
        message: "countryName query parameter is required",
      });
      return;
    }

    const access = await getCountryRoomAccess(
      String(userId),
      String(req.user?.role ?? ""),
      countryName,
    );

    if (!access.canEnter) {
      res.status(403).json({
        success: false,
        message: "You do not have access to this country room",
      });
      return;
    }

    const room = await getOrCreateCountryRoomService(
      countryName,
      userId as string,
    );

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const getCountryRoomAccessHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = String(req.user?.id ?? "");
    const countryName = String(req.query.countryName ?? "");
    const result = await getCountryRoomAccess(
      userId,
      String(req.user?.role ?? ""),
      countryName,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const requestCountryRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const request = await createCountryRoomRequest(
      String(req.user?.id ?? ""),
      String(req.body.countryName ?? ""),
    );
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

export const getMyCountryRoomRequestsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requests = await getMyCountryRoomRequests(String(req.user?.id ?? ""));
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

export const getCountryRoomRequestsForReviewHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requests = await getCountryRoomRequestsForReview();
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

export const reviewCountryRoomRequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = req.body.status;
    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ success: false, message: "Invalid review status" });
      return;
    }

    const request = await reviewCountryRoomRequest(
      String(req.params.id),
      String(req.user?.id ?? ""),
      status,
    );
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};
