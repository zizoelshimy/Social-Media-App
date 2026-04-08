import { DataBaseRepository } from ".";
import { IUser } from "../../common/interfaces";
import { UserModel } from "../models/user.model";
export class UserRepository extends DataBaseRepository<IUser> {
constructor(){
    super(UserModel)
    
}
}