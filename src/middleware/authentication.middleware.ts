import { NextFunction ,Request,Response} from "express"
import { ForbiddenException, UnauthorizedException } from "../common/exceptions";
import { TokenService } from "../common/services";
import { TokenTypeEnum } from "../common/enums";
/* export interface IRequest extends Request {
  user?:HydratedDocument<IUser>
  decoded?:JwtPayload
} */

export const authentication = (tokenType: TokenTypeEnum.ACCESS | TokenTypeEnum.REFRESH ) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tokenService=new TokenService()
    const [key, credential] = req.headers?.authorization?.split(" ") || [];
    console.log({ key, credential });
    if (!key || !credential) {
      throw new UnauthorizedException('Missing authorization')
    }
    switch (key) {
      case 'Basic':
        break;
      default:
        const {decodedToken ,user}  = await tokenService.decodedToken({ token: credential, tokenType })
        req.user = user
        req.decoded=decodedToken 
        break;
    }

    next()
  }
}

