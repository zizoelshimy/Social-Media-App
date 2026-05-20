import { HydratedDocument } from "mongoose"
import { IUser } from "../interfaces"
import { AvailabilityEnum } from "../enums"

export const getAvailability = (user:HydratedDocument<IUser>)=>{
   return [
            {availability:AvailabilityEnum.PUBLIC},
            {availability:AvailabilityEnum.ONLY_ME , createdBy:user._id}, // we can see our post if we set it to only me
            {availability:AvailabilityEnum.FRiENDS, createdBy:{$in:[user._id,...(user.friends || []) ]}}, //we can see post of our friends if they set it to friends and we are their friend
            {tags:{$in:[user._id]}},
                ];
}