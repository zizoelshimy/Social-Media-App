"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const services_1 = require("../../common/services");
const config_1 = require("../../config/config");
class UserService {
    redis;
    tokenService;
    constructor() {
        this.redis = new services_1.RedisService();
        this.tokenService = new services_1.TokenService();
    }
    async profile(user) {
        return user.toJSON();
    }
    //log out
    async logout({ flag }, user, { jti, iat, sub }) {
        if (!user) {
            throw new exceptions_1.NotFoundException("invalid logout request");
        }
        if (!jti || !iat) {
            throw new exceptions_1.NotFoundException("missing token metadata for logout");
        }
        let status = 200;
        switch (flag) {
            case enums_1.LogOutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save();
                await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)));
                break;
            default:
                await this.tokenService.createRevokeToken({ userId: sub, jti, ttl: iat + config_1.REFRESH_TOKEN_EXPIRES_IN });
                status = 201;
                break;
        }
        return status;
    }
    ;
    //rotate token
    async rotateToken(token, { sub, jti, iat }, issuer) {
        {
            if (!token) {
                throw new exceptions_1.NotFoundException("not registered account");
            }
            if ((iat + config_1.REFRESH_TOKEN_EXPIRES_IN) * 1000 >= Date.now() + (5 * 60 * 1000)) {
                throw new exceptions_1.ConflictException("current token is still valid");
            }
            await this.tokenService.createRevokeToken({ userId: sub, jti, ttl: iat + config_1.REFRESH_TOKEN_EXPIRES_IN });
            return this.tokenService.createLoginCredentials(token, issuer);
        }
        ;
    }
}
exports.default = UserService;
