"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTRGRAM_LINK = exports.TWITTER_LINK = exports.FACEBOOK_LINK = exports.EMAIL_ALLOW_INVALID_CERT = exports.APPLICATION_NAME = exports.EMAIL_APP = exports.EMAIL_APP_PASSWORD = exports.MAIL_TLS_REJECT_UNAUTHORIZED = exports.REDIS_URI = exports.REFRESH_TOKEN_EXPIRES_IN = exports.ACCESS_TOKEN_EXPIRES_IN = exports.SYSTEM_REFRESH_TOKEN_SIGNATURE = exports.SYSTEM_ACCESS_TOKEN_SIGNATURE = exports.USER_REFRESH_TOKEN_SIGNATURE = exports.USER_ACCESS_TOKEN_SIGNATURE = exports.ENC_KEY = exports.ENC_IV_LENGTH = exports.SALT_ROUND = exports.DB_URI = exports.PORT = void 0;
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)(`./.env.${process.env.NODE_ENV}`) });
exports.PORT = process.env.PORT;
exports.DB_URI = process.env.DB_URI;
exports.SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
exports.ENC_IV_LENGTH = parseInt(process.env.ENC_IV_LENGTH ?? "16");
exports.ENC_KEY = process.env.ENC_KEY;
exports.USER_ACCESS_TOKEN_SIGNATURE = process.env
    .USER_ACCESS_TOKEN_SIGNATURE;
exports.USER_REFRESH_TOKEN_SIGNATURE = process.env
    .USER_REFRESH_TOKEN_SIGNATURE;
exports.SYSTEM_ACCESS_TOKEN_SIGNATURE = process.env
    .SYSTEM_ACCESS_TOKEN_SIGNATURE;
exports.SYSTEM_REFRESH_TOKEN_SIGNATURE = process.env
    .SYSTEM_REFRESH_TOKEN_SIGNATURE;
exports.ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800");
exports.REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN ?? "1800");
exports.REDIS_URI = process.env.REDIS_URI;
exports.MAIL_TLS_REJECT_UNAUTHORIZED = process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== "false";
exports.EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
exports.EMAIL_APP = process.env.EMAIL_APP;
exports.APPLICATION_NAME = process.env.APPLICATION_NAME;
exports.EMAIL_ALLOW_INVALID_CERT = process.env.EMAIL_ALLOW_INVALID_CERT === "true";
exports.FACEBOOK_LINK = process.env.FACEBOOK_LINK;
exports.TWITTER_LINK = process.env.TWITTER_LINK;
exports.INSTRGRAM_LINK = process.env.INSTRGRAM_LINK;
