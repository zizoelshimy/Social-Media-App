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
import { PostRepository, UserRepository } from "../../DB/repository";

class UserService {
  private readonly redis: RedisService;
  private tokenService: TokenService;
  private readonly s3: S3Service;
  private readonly userRepository: UserRepository;
  constructor() {
    this.redis = new RedisService();
    this.tokenService = new TokenService();
    this.s3 = new S3Service();
    this.userRepository = new UserRepository();
  }
  async profile(user: HydratedDocument<IUser>): Promise<any> {
    return user.toJSON();
  }

  async updateProfile(
    payload: Partial<
      Pick<
        IUser,
        | "firstName"
        | "lastName"
        | "phone"
        | "DOB"
        | "profilePicture"
        | "profileCoverPictures"
      >
    >,
    user: HydratedDocument<IUser>,
  ): Promise<IUser> {
    if (payload.firstName) user.firstName = payload.firstName;
    if (payload.lastName) user.lastName = payload.lastName;
    if (payload.phone) user.phone = payload.phone;
    if (payload.DOB) user.DOB = payload.DOB;
    if (payload.profilePicture) user.profilePicture = payload.profilePicture;
    if (payload.profileCoverPictures)
      user.profileCoverPictures = payload.profileCoverPictures;
    user.slug = `${user.firstName}-${user.lastName}`.toLowerCase();
    await user.save();
    return user.toJSON();
  }

  async profilePosts(userId: string, viewer: HydratedDocument<IUser>) {
    const profileUser = await this.userRepository.findOne({
      filter: { _id: userId },
      options: { populate: [{ path: "friends" }], lean: false } as any,
    });
    if (!profileUser) {
      throw new NotFoundException("Profile not found");
    }
    const postRepository = new PostRepository();
    return await postRepository.paginate({
      filter: {
        createdBy: userId,
        ...(viewer._id.toString() === userId
          ? {}
          : { availability: { $in: [0, 1] } }),
      },
    });
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
    //const oldPic= user.profilePicture
    const { url, key } = await this.s3.createPresignedUploadLink({
      Bucket: AWS_BUCKET_NAME,
      contentType,
      Originalname: OriginalName,
      path: `Users/${user._id.toString()}/Profile`,
    });
    /*  user.profilePicture = key;
    await user.save();
      if(oldPic){
        await this.s3.deleteAsset({ Key: oldPic })
      } */
    return { user: user.toJSON(), url, key };
  }

  async profileCoverImages(
    files: Express.Multer.File[],
    user: HydratedDocument<IUser>,
  ): Promise<any> {
    const oldUrls = user.profileCoverPictures || [];
    const urls = await this.s3.uploadAssets({
      Bucket: AWS_BUCKET_NAME,
      files,
      path: `Users/${user._id.toString()}/Profile/Cover`,
      storageApproach: StorageApproachEnum.DISK,
      uploadApproach: UploadApproachEnum.LARGE,
    });
    user.profileCoverPictures = urls;
    await user.save();
    if (oldUrls?.length) {
      await this.s3.deleteAssets({
        Keys: oldUrls.map((url) => ({ Key: url })),
      });
    }
    return user.toJSON();
  }

  async deleteProfile(user: HydratedDocument<IUser>) {
    const account = await this.userRepository.deleteOne({
      filter: { _id: user._id, force: true },
    });
    if (!account.deletedCount) {
      throw new NotFoundException("account not found");
    }
    await this.s3.deleteFolderByPrefix({
      prefix: `Users/${user._id.toString()}`,
    });
    return account;
  }
}
export default UserService;
