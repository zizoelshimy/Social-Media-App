"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const config_1 = require("../../config/config");
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
}
exports.RedisService = RedisService;
const redisService = new RedisService();
exports.default = redisService;
