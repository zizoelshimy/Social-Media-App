import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { AvailabilityEnum } from "../enums/post.enum";
export type ReactionEmoji = "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";

export interface IReaction {
user: Types.ObjectId | IUser;
emoji: ReactionEmoji;
createdAt?: Date;
updatedAt?: Date;
}

export interface IPost{

folderId:string;
content?:string;
attachments?:string[];
likes?:Types.ObjectId[] | IUser[];
reactions?:IReaction[];
tags?:Types.ObjectId[] | IUser[];
availability:AvailabilityEnum;

createdBy:Types.ObjectId| IUser;
updatedBy:Types.ObjectId| IUser;
createdAt:Date;
updatedAt?:Date;
deletedAt?:Date;
restoredAt?:Date;


}
