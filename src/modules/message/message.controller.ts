import { Request, Response, NextFunction } from 'express';
import { getMessageHistory } from './message.services';
import { Room } from '../room/room.modal';


export const getMessageHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;

    const room = await Room.findById(roomId).select('type members').lean();
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }
    if (room.type === 'private' && !room.members.some((member) => String(member) === String(req.user?.id))) {
      res.status(403).json({ success: false, message: 'You are not a member of this private room' });
      return;
    }

    const messages = await getMessageHistory(roomId as string, page, limit);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};