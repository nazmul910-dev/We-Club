import { Types } from 'mongoose';


export interface IMessage {
  room: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  replyTo?: Types.ObjectId | null;
  isDeleted?: boolean | undefined;
  deletedAt?: Date | undefined;
}

export interface IMessageDocument extends IMessage, Document { }

// export interface ICreateMessage {
//   room: Types.ObjectId;
//   sender: Types.ObjectId;
//   content: string;
//   replyTo?: Types.ObjectId | undefined;
// }

// export interface IUpdateMessage {
//   content?: string | undefined;
//   replyTo?: Types.ObjectId | null | undefined;
//   isDeleted?: boolean | null | undefined;
//   deletedAt?: Date | null | undefined;
// }

// export interface IMessageQuery {
//   room?: string | undefined;
//   sender?: string | undefined;
//   content?: string | undefined;
//   replyTo?: string | undefined;
//   isDeleted?: boolean | undefined;
//   deletedAt?: Date | undefined;
// }