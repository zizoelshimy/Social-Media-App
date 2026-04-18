
import { NextFunction ,Request,Response} from "express"
import { ForbiddenException} from "../common/exceptions";
import { RoleEnum } from "../common/enums";
export const authorization = (accessRoles :RoleEnum[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!accessRoles.includes(req.user.role)) {
      throw new ForbiddenException( "You don't have permission to access this resource",);
    }
    next();
  };
};