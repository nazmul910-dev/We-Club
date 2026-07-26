import { Request, Response, NextFunction } from 'express';
import { getMessageHistory } from './message.services';


export const getMessageHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;

    const messages = await getMessageHistory(roomId as string, page, limit);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};