import { Request, Response, NextFunction } from "express";

import { getGeneralRoom } from "./room.service";

export const getGeneralRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const room = await getGeneralRoom(req.user.id as string);

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};
