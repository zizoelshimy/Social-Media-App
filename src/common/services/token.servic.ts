import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  SYSTEM_ACCESS_TOKEN_SIGNATURE,
  SYSTEM_REFRESH_TOKEN_SIGNATURE,
  USER_ACCESS_TOKEN_SIGNATURE,
  USER_REFRESH_TOKEN_SIGNATURE,
} from "../../config/config";
import { RoleEnum } from "../enums";
import { TokenTypeEnum } from "../enums/token.enum";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../exceptions";
import { UserRepository } from "../../DB/repository";
import { RedisService } from "./redis.service";
import { HydratedDocument } from "mongoose";
import { IUser } from "../interfaces";
import { randomUUID } from "crypto";
type SignaturesType = { accessSignuture: string; refreshSignature: string };
export class TokenService {
  private readonly userRepository: UserRepository;
  private readonly redis: RedisService;
  constructor() {
    this.userRepository = new UserRepository();
    this.redis = new RedisService();
  }

  sign = async ({
    payload,
    secret = USER_ACCESS_TOKEN_SIGNATURE,
    options,
  }: {
    payload: object;
    secret?: string;
    options?: SignOptions;
  }): Promise<string> => {
    return jwt.sign(payload, secret, options);
  };
  verify = async ({
    token,
    secret = USER_ACCESS_TOKEN_SIGNATURE,
    options,
  }: {
    token: string;
    secret?: string;
    options?: SignOptions;
  }): Promise<JwtPayload> => {
    return jwt.verify(token, secret) as JwtPayload;
  };

  detectSignatureLevel = async (level: RoleEnum): Promise<SignaturesType> => {
    let signutures: SignaturesType;
    switch (level) {
      case RoleEnum.ADMIN:
        signutures = {
          accessSignuture: SYSTEM_ACCESS_TOKEN_SIGNATURE,
          refreshSignature: SYSTEM_REFRESH_TOKEN_SIGNATURE,
        };
        break;
      default:
        signutures = {
          accessSignuture: USER_ACCESS_TOKEN_SIGNATURE,
          refreshSignature: USER_REFRESH_TOKEN_SIGNATURE,
        };
        break;
    }
    return signutures;
  };
  getTokenSignature = async (
    tokenType = TokenTypeEnum.ACCESS,
    level: RoleEnum,
  ): Promise<string> => {
    const { accessSignuture, refreshSignature } =
      await this.detectSignatureLevel(level);
    let signuture = undefined;
    switch (tokenType) {
      case TokenTypeEnum.REFRESH:
        signuture = refreshSignature;
        break;
      case TokenTypeEnum.ACCESS:
        signuture = accessSignuture;
        break;
      default:
        throw new BadRequestException("Invalid token type");
    }
    return signuture;
  };

  //decoded token
  decodeToken = async ({
    token,
    tokenType = TokenTypeEnum.ACCESS,
  }: {
    token: string;
    tokenType: TokenTypeEnum;
  }): Promise<{ user: HydratedDocument<IUser>; decodedToken: JwtPayload }> => {
    const decodedToken = jwt.decode(token) as JwtPayload;
    console.log(decodedToken);
    if (!decodedToken?.aud?.length) {
      throw new BadRequestException("Missing audience in token");
    }
    const [tokenApproach, level] = decodedToken.aud || [];
    if (!tokenApproach || !level) {
      throw new BadRequestException("Missing token audience");
    }
    if (tokenType != (tokenApproach as unknown as TokenTypeEnum)) {
      throw new ConflictException(
        "Unexpected token mechanism we expected: " +
          tokenType +
          ", but got: " +
          tokenApproach,
      );
    }

    if (
      decodedToken.jti &&
      (await this.redis.get(
        this.redis.revokeTokenKey({
          userId: decodedToken.sub as string,
          jti: decodedToken.jti,
        }),
      ))
    ) {
      throw new UnauthorizedException("Invalid login session");
    }
    const secret = await this.getTokenSignature(
      tokenApproach as unknown as TokenTypeEnum,
      level as unknown as RoleEnum,
    );
    const verifiedData = jwt.verify(token, secret);
    console.log(verifiedData);
    const user = await this.userRepository.findOne({
      filter: { _id: verifiedData.sub, role: level as unknown as RoleEnum },
    });
    if (!user) {
      throw new NotFoundException("not registered account");
    }
    if (
      user.changeCredentialsTime &&
      user.changeCredentialsTime?.getTime() >=
        (decodedToken.iat as number) * 1000
    ) {
      throw new UnauthorizedException("Invalid login session ");
    }
    return { user, decodedToken };
  };
  //createLoginCredentials
  createLoginCredentials = async (
    user: HydratedDocument<IUser>,
    issuer: string,
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const { accessSignuture, refreshSignature } =
      await this.detectSignatureLevel(user.role);
    const jwtid = randomUUID();
    const access_token = await this.sign({
      payload: { userId: user._id }, //payload
      secret: accessSignuture, //secret key
      options: {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        issuer: issuer, // to specify the issuer of the token, which can be used for validation and verification purposes when the token is received by the server in subsequent requests
        audience: [
          TokenTypeEnum.ACCESS as unknown as string,
          user.role as unknown as string,
        ], // to specify the audience of the token, which can be used to restrict the token's usage to a specific user or group of users
        jwtid,
      },
    });
    const refresh_token = await this.sign({
      payload: { userId: user._id }, //payload
      secret: refreshSignature, //secret key
      options: {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer: issuer, // to specify the issuer of the token, which can be used for validation and verification purposes when the token is received by the server in subsequent requests
        audience: [
          TokenTypeEnum.REFRESH as unknown as string,
          user.role as unknown as string,
        ], // to specify the audience of the token, which can be used to restrict the token's usage to a specific user or group of users
        jwtid,
      },
    });
    return { access_token, refresh_token };
  };
}
