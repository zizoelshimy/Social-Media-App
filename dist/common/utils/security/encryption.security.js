"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDecryption = exports.generateEncryption = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("../../../config/config");
const exceptions_1 = require("../../exceptions");
const generateEncryption = async (plainText) => {
    //first step come here 
    //console.log(crypto.randomBytes(IV_LENGTH).toString('hex')) //this only to generate random IV for encryption and decryption process, it should be stored in the database with the cipher text to be used in decryption process
    const iv = node_crypto_1.default.randomBytes(config_1.ENC_IV_LENGTH);
    const cipher = node_crypto_1.default.createCipheriv('aes-256-cbc', config_1.ENC_KEY, iv);
    let cipherText = cipher.update(plainText, 'utf-8', 'hex');
    cipherText += cipher.final('hex');
    return `${iv.toString('hex')}:${cipherText}`;
};
exports.generateEncryption = generateEncryption;
const generateDecryption = async (cipherText) => {
    const [iv, encryptedData] = cipherText.split(':') || [];
    if (!iv || !encryptedData) {
        throw new exceptions_1.BadRequestException('Invalid cipher text format');
    }
    const ivLikeBinary = Buffer.from(iv, 'hex');
    let decipher = node_crypto_1.default.createDecipheriv('aes-256-cbc', config_1.ENC_KEY, ivLikeBinary);
    let plainText = decipher.update(encryptedData, 'hex', 'utf-8');
    plainText += decipher.final('utf-8');
    return plainText;
};
exports.generateDecryption = generateDecryption;
