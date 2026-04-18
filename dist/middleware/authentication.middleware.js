"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const exceptions_1 = require("../common/exceptions");
const services_1 = require("../common/services");
/* export interface IRequest extends Request {
  user?:HydratedDocument<IUser>
  decoded?:JwtPayload
} */
const authentication = (tokenType) => {
    return async (req, res, next) => {
        const tokenService = new services_1.TokenService();
        const [key, credential] = req.headers?.authorization?.split(" ") || [];
        console.log({ key, credential });
        if (!key || !credential) {
            throw new exceptions_1.UnauthorizedException('Missing authorization');
        }
        switch (key) {
            case 'Basic':
                break;
            default:
                const { decodedToken, user } = await tokenService.decodedToken({ token: credential, tokenType });
                req.user = user;
                req.decoded = decodedToken;
                break;
        }
        next();
    };
};
exports.authentication = authentication;
