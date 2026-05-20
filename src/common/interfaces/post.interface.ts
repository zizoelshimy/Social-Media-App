import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { AvailabilityEnum } from "../enums/post.enum";
export interface IPost{

folderId:string;
content?:string;
attachments?:string[];
likes?:Types.ObjectId[] | IUser[];
tags?:Types.ObjectId[] | IUser[];
availability:AvailabilityEnum;

createdBy:Types.ObjectId| IUser;
updatedBy:Types.ObjectId| IUser;
createdAt:Date;
updatedAt?:Date;
deletedAt?:Date;
restoredAt?:Date;


}