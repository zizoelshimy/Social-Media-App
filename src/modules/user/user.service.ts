import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
import { ConflictException, NotFoundException } from "../../common/exceptions";
import {
  LogOutEnum,
  StorageApproachEnum,
  UploadApproachEnum,
} from "../../common/enums";
import { RedisService, S3Service, TokenService } from "../../common/services";
import { AWS_BUCKET_NAME, REFRESH_TOKEN_EXPIRES_IN } from "../../config/config";

class UserService {
  private readonly redis: RedisService;
  private tokenService: TokenService;
  private readonly s3: S3Service;
  constructor() {
    this.redis = new RedisService();
    this.tokenService = new TokenService();
    this.s3 = new S3Service();
  }
  async profile(user: HydratedDocument<IUser>): Promise<any> {
    return user.toJSON();
  }

  //log out
  async logout(
    { flag }: { flag: LogOutEnum },
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
  ): Promise<number> {
    if (!user) {
      throw new NotFoundException("invalid logout request");
    }

    if (!jti || !iat) {
      throw new NotFoundException("missing token metadata for logout");
    }

    let status = 200;
    switch (flag) {
      case LogOutEnum.ALL:
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.deleteKey(
          await this.redis.keys(this.redis.baseRevokeTokenKey(sub)),
        );
        break;
      default:
        await this.tokenService.createRevokeToken({
          userId: sub,
          jti,
          ttl: iat + REFRESH_TOKEN_EXPIRES_IN,
        });
        status = 201;
        break;
    }
    return status;
  }

  //rotate token
  async rotateToken(
    token: HydratedDocument<IUser>,
    { sub, jti, iat }: { jti: string; iat: number; sub: string },
    issuer: string,
  ) {
    if (!token) {
      throw new NotFoundException("not registered account");
    }
    if ((iat + REFRESH_TOKEN_EXPIRES_IN) * 1000 >= Date.now() + 5 * 60 * 1000) {
      throw new ConflictException("current token is still valid");
    }
    await this.tokenService.createRevokeToken({
      userId: sub,
      jti,
      ttl: iat + REFRESH_TOKEN_EXPIRES_IN,
    });
    return this.tokenService.createLoginCredentials(token, issuer);
  }

  async profileImage(
    {
      contentType,
      OriginalName,
    }: { contentType: string; OriginalName: string },
    user: HydratedDocument<IUser>,
  ): Promise<{ user: IUser; url: string; key: string }> {
    const { url, key } = await this.s3.createPresignedUploadLink({
      Bucket: AWS_BUCKET_NAME,
      contentType,
      Originalname: OriginalName,
      path: `Users/${user._id.toString()}/Profile`,
    });
    user.profilePicture = key;
    await user.save();
    return { user: user.toJSON(), url, key };
  }

  async profileCoverImages(
    files: Express.Multer.File[],
    user: HydratedDocument<IUser>,
  ): Promise<any> {
    const urls = await this.s3.uploadAssets({
      Bucket: AWS_BUCKET_NAME,
      files,
      path: `Users/${user._id.toString()}/Profile/Cover`,
      storageApproach: StorageApproachEnum.DISK,
      uploadApproach: UploadApproachEnum.LARGE,
    });
    user.profileCoverPictures = urls;
    await user.save();
    return user.toJSON();
  }
}
export default UserService;
