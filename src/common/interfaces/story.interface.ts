import { Types } from "mongoose";
import { IUser } from "./user.interface";

export interface IStory {
  folderId: string;
  content?: string;
  attachments?: string[];
  viewers?: Types.ObjectId[] | IUser[];
  createdBy: Types.ObjectId | IUser;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
