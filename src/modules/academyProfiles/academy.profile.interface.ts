import { Types } from "mongoose";


export const NOTIFICATION_TYPES = [
  "email",
  "push",
  "sms",
] as const;


export type NotificationType =
  (typeof NOTIFICATION_TYPES)[number];


export interface INotificationPreferences {

  email: boolean;

  push: boolean;

  sms: boolean;

}



export interface IAcademyProfile {


  user: Types.ObjectId;


  mentor?: Types.ObjectId | undefined;


  currentPillar?: Types.ObjectId | undefined;



  academyName?: string | undefined;


  bio?: string | undefined;


  experienceLevel?:
  | "beginner"
  | "intermediate"
  | "advanced"
  | undefined;



  goals?: string[] | undefined;



  totalPoints: number;


  currentStreak: number;


  longestStreak: number;



  notificationPreferences:
  INotificationPreferences;



  createdAt?: Date;

  updatedAt?: Date;

}