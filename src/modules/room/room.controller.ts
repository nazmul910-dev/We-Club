import { Request, Response, NextFunction } from "express";

import { getGeneralRoom } from "./room.service";

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
