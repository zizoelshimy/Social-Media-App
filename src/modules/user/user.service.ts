import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";


class UserService {
    constructor() {}
   async profile(user: HydratedDocument<IUser>): Promise<any> {
    return user.toJSON()
    }
}

export default UserService;