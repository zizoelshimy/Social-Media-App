import { Types } from "mongoose";
import { IUser } from "./user.interface";

export enum NotificationAudienceEnum {
  ALL = "all",
  USERS = "users",
}

export interface INotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  audience: NotificationAudienceEnum;
  recipients?: Types.ObjectId[] | IUser[];
  readBy?: Types.ObjectId[] | IUser[];
  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
