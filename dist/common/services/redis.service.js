"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../../config/config");
const email_enum_1 = require("../enums/email.enum");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({ url: config_1.REDIS_URI });
        this.handelEvents();
    }
    async handelEvents() {
        this.client.on("error", (err) => {
            console.log(`Redis Client Error ,,,${err}`);
        });
        this.client.on("ready", (err) => {
            console.log(`Redis Is Ready ,,,`);
        });
    }
    async connect() {
        await this.client.connect();
        console.log(`Redis Is Connected`);
    }
    otpKey = ({ email, subject = email_enum_1.EmailEnum.CONFIRM_EMAIL }) => {
        return `OTP::User::${email}::${subject}`;
    };
    maxAttemptOtpKey = ({ email, subject = email_enum_1.EmailEnum.CONFIRM_EMAIL }) => {
        return `${this.otpKey({ email, subject })}::MaxTrial`;
    };
    blockOtpKey = ({ email, subject = email_enum_1.EmailEnum.CONFIRM_EMAIL }) => {
        return `${this.otpKey({ email, subject })}::Block`;
    };
    baseRevokeTokenKey = (userId) => {
        return `RevokeToken::${userId.toString()}`;
    };
    revokeTokenKey = ({ userId, jti }) => {
        return `${this.baseRevokeTokenKey(userId)}::${jti}`;
    };
    set = async ({ key, value, ttl }) => {
        try {
            let data = typeof value === 'string' ? value : JSON.stringify(value);
            return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data);
        }
        catch (error) {
            console.log(`field in Redis set operations ${error}`);
            return null;
        }
    };
    update = async ({ key, value, ttl }) => {
        try {
            if (!await this.client.exists(key)) {
                return 0;
            }
            return await this.set({ key, value, ttl });
        }
        catch (error) {
            console.log(`field in Redis update operations ${error}`);
            return null;
        }
    };
    get = async (key) => {
        try {
            try {
                return JSON.parse(await this.client.get(key));
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.log(`field in Redis get   operations ${error}`);
            return;
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log(`field in Redis ttl   operations ${error}`);
            return -2;
        }
    };
    incr = async (key) => {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.log(`field in Redis incr   operations ${error}`);
            return -2;
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log(`field in Redis exists   operations ${error}`);
            return -2;
        }
    };
    expire = async ({ key, ttl }) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            console.log(`field in Redis add-expire   operations ${error}`);
            return 0;
        }
    };
    mGet = async (keys) => {
        try {
            if (!keys.length)
                return 0;
            return await this.client.mGet(keys);
        }
        catch (error) {
            console.log(`field in Redis mget  operations ${error}`);
            return [];
        }
    };
    keys = async (prefix) => {
        try {
            return await this.client.keys(`${prefix}*`);
        }
        catch (error) {
            console.log(`field in Redis keys  operations ${error}`);
            return [];
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            console.log(`field in Redis delete operations ${error}`);
            return 0;
        }
    };
}
exports.RedisService = RedisService;
const redisService = new RedisService();
exports.default = redisService;
