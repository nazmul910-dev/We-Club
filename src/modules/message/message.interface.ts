import { Types } from 'mongoose';

export interface IMessage {
  room: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
}