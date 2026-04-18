"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config/config");
const enums_1 = require("../enums");
const token_enum_1 = require("../enums/token.enum");
const exceptions_1 = require("../exceptions");
const repository_1 = require("../../DB/repository");
const redis_service_1 = require("./redis.service");
const crypto_1 = require("crypto");
class TokenService {
    userRepository;
    redis;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = new redis_service_1.RedisService();
    }
    sign = async ({ payload, secret = config_1.USER_ACCESS_TOKEN_SIGNATURE, options, }) => {
        return jsonwebtoken_1.default.sign(payload, secret, options);
    };
    verify = async ({ token, secret = config_1.USER_ACCESS_TOKEN_SIGNATURE, options, }) => {
        return jsonwebtoken_1.default.verify(token, secret);
    };
    detectSignatureLevel = async (level) => {
        let signutures;
        switch (level) {
            case enums_1.RoleEnum.ADMIN:
                signutures = {
                    accessSignuture: config_1.SYSTEM_ACCESS_TOKEN_SIGNATURE,
                    refreshSignature: config_1.SYSTEM_REFRESH_TOKEN_SIGNATURE,
                };
                break;
            default:
                signutures = {
                    accessSignuture: config_1.USER_ACCESS_TOKEN_SIGNATURE,
                    refreshSignature: config_1.USER_REFRESH_TOKEN_SIGNATURE,
                };
                break;
        }
        return signutures;
    };
    getTokenSignature = async (tokenType = token_enum_1.TokenTypeEnum.ACCESS, level) => {
        const { accessSignuture, refreshSignature } = await this.detectSignatureLevel(level);
        let signuture = undefined;
        switch (tokenType) {
            case token_enum_1.TokenTypeEnum.REFRESH:
                signuture = refreshSignature;
                break;
            case token_enum_1.TokenTypeEnum.ACCESS:
                signuture = accessSignuture;
                break;
            default:
                throw new exceptions_1.BadRequestException("Invalid token type");
        }
        return signuture;
    };
    //decoded token
    decodedToken = async ({ token, tokenType = token_enum_1.TokenTypeEnum.ACCESS, }) => {
        const decodedToken = jsonwebtoken_1.default.decode(token);
        const decodedUserId = decodedToken?.sub ??
            decodedToken?.userId;
        console.log(decodedToken);
        if (!decodedToken?.aud?.length) {
            throw new exceptions_1.BadRequestException("Missing audience in token");
        }
        const [tokenApproach, level] = decodedToken.aud || [];
        if (tokenApproach == undefined || level == undefined) {
            throw new exceptions_1.BadRequestException("Missing token audience");
        }
        if (tokenType != tokenApproach) {
            throw new exceptions_1.ConflictException("Unexpected token mechanism we expected: " +
                tokenType +
                ", but got: " +
                tokenApproach);
        }
        if (!decodedUserId) {
            throw new exceptions_1.UnauthorizedException("Invalid token payload");
        }
        if (decodedToken.jti &&
            (await this.redis.get(this.redis.revokeTokenKey({
                userId: decodedUserId,
                jti: decodedToken.jti,
            })))) {
            throw new exceptions_1.UnauthorizedException("Invalid login session");
        }
        const secret = await this.getTokenSignature(tokenApproach, level);
        const verifiedData = jsonwebtoken_1.default.verify(token, secret);
        const verifiedUserId = verifiedData?.sub ??
            verifiedData?.userId;
        console.log(verifiedData);
        if (!verifiedUserId) {
            throw new exceptions_1.UnauthorizedException("Invalid token payload");
        }
        const user = await this.userRepository.findOne({
            filter: { _id: verifiedUserId, role: level },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("not registered account");
        }
        if (user.changeCredentialsTime &&
            user.changeCredentialsTime?.getTime() >=
                decodedToken.iat * 1000) {
            throw new exceptions_1.UnauthorizedException("Invalid login session ");
        }
        return { user, decodedToken };
    };
    //createLoginCredentials
    createLoginCredentials = async (user, issuer) => {
        const { accessSignuture, refreshSignature } = await this.detectSignatureLevel(user.role);
        const jwtid = (0, crypto_1.randomUUID)();
        const access_token = await this.sign({
            payload: { userId: user._id }, //payload
            secret: accessSignuture, //secret key
            options: {
                expiresIn: config_1.ACCESS_TOKEN_EXPIRES_IN,
                subject: user._id.toString(),
                issuer: issuer, // to specify the issuer of the token, which can be used for validation and verification purposes when the token is received by the server in subsequent requests
                audience: [
                    token_enum_1.TokenTypeEnum.ACCESS,
                    user.role,
                ], // to specify the audience of the token, which can be used to restrict the token's usage to a specific user or group of users
                jwtid,
            },
        });
        const refresh_token = await this.sign({
            payload: { userId: user._id }, //payload
            secret: refreshSignature, //secret key
            options: {
                expiresIn: config_1.REFRESH_TOKEN_EXPIRES_IN,
                subject: user._id.toString(),
                issuer: issuer, // to specify the issuer of the token, which can be used for validation and verification purposes when the token is received by the server in subsequent requests
                audience: [
                    token_enum_1.TokenTypeEnum.REFRESH,
                    user.role,
                ], // to specify the audience of the token, which can be used to restrict the token's usage to a specific user or group of users
                jwtid,
            },
        });
        return { access_token, refresh_token };
    };
    createRevokeToken = async ({ userId, jti, ttl }) => {
        await this.redis.set({
            key: this.redis.revokeTokenKey({ userId, jti }),
            value: jti,
            ttl
        });
        return;
    };
}
exports.TokenService = TokenService;
