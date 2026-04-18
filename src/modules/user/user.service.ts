import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
import { ConflictException, NotFoundException } from "../../common/exceptions";
import { LogOutEnum } from "../../common/enums";
import { RedisService, TokenService } from "../../common/services";
import { REFRESH_TOKEN_EXPIRES_IN } from "../../config/config";


class UserService {
    private readonly redis:RedisService
    private tokenService:TokenService
    constructor() {
        this.redis=new RedisService() 
        this.tokenService=new TokenService()
    }
   async profile(user: HydratedDocument<IUser>): Promise<any> {
    return user.toJSON()
    }

  //log out
  async logout  ({ flag }: { flag: LogOutEnum }, user: HydratedDocument<IUser>, { jti, iat,sub }: { jti: string, iat: number, sub: string }): Promise<number> {
  if (!user) {
    throw new NotFoundException( "invalid logout request");
  }

  if (!jti || !iat) {
    throw new NotFoundException( "missing token metadata for logout");
  }

  let status = 200;
  switch (flag) {
    case LogOutEnum.ALL:
      user.changeCredentialsTime = new Date();
      await user.save();
      await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)));
      break;
    default:
      await this.tokenService.createRevokeToken({userId: sub, jti, ttl: iat + REFRESH_TOKEN_EXPIRES_IN });
      status = 201;
      break;
  }
  return status;
};

//rotate token
async rotateToken  (token: HydratedDocument<IUser>, {sub,jti, iat}: { jti: string, iat: number, sub: string }, issuer: string) { {
  if (!token) {
    throw new NotFoundException( "not registered account" );
  }
  if((iat+REFRESH_TOKEN_EXPIRES_IN)*1000>= Date.now()+(5*60*1000)){
    throw new ConflictException( "current token is still valid" );
  }
  await this.tokenService.createRevokeToken({userId: sub, jti, ttl: iat + REFRESH_TOKEN_EXPIRES_IN });
  return this.tokenService.createLoginCredentials(token, issuer);
};


}
}
export default UserService;