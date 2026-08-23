import { Request, Response, NextFunction } from "express";
import { User } from "../users/users.model.schema";
import { resolveCountry } from "../../utility/country";

import {
  getGeneralRoom,
  getOrCreateCountryRoom as getOrCreateCountryRoomService,
} from "./room.service";

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

    const canChooseAnyRoom =
      req.user?.role === "founder" ||
      req.user?.role === "admin" ||
      req.user?.role === "manager";

    const countryName = req.query.countryName;

    if (typeof countryName !== "string" || !countryName.trim()) {
      res.status(400).json({
        success: false,
        message: "countryName query parameter is required",
      });
      return;
    }

    if (!canChooseAnyRoom) {
      const userDoc = await User.findById(userId).select("country");
      const userCountry = resolveCountry(userDoc?.country);
      const requestedCountry = resolveCountry(countryName);

      if (!userCountry || !requestedCountry || userCountry.code !== requestedCountry.code) {
        res.status(403).json({
          success: false,
          message: "You can only access your own country room",
        });
        return;
      }
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
