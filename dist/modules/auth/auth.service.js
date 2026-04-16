"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const repository_1 = require("../../DB/repository");
const exceptions_1 = require("../../common/exceptions");
const security_1 = require("../../common/utils/security");
const email_1 = require("../../common/utils/email");
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const enums_1 = require("../../common/enums");
const otp_1 = require("../../common/utils/otp");
const security_2 = require("../../common/utils/security");
const token_servic_1 = require("../../common/services/token.servic");
class AuthenticationService {
    userRepository;
    redis;
    tokenService;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = redis_service_1.default;
        this.tokenService = new token_servic_1.TokenService();
    }
    async login(inputs, issuer) {
        {
            const { email, password } = inputs;
            const user = await this.userRepository.findOne({
                filter: { email, provider: enums_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: true, $ne: null } },
            });
            if (!user) {
                throw new exceptions_1.NotFoundException("Invalid email or password");
            }
            if (!(await (0, security_2.compareHash)({
                plaintext: password,
                ciphertext: user.password
            }))) {
                throw new exceptions_1.NotFoundException("Invalid email or password");
            }
            return await this.tokenService.createLoginCredentials(user, issuer);
        }
        ;
    }
    // the in to db is raw data and the out data is hydrated wit recpect to the service and the out to front is raw data to can not update it
    async sendEmailOtp({ email, subject, title, }) {
        const isBlocked = await this.redis.ttl(this.redis.blockOtpKey({ email, subject }));
        if (isBlocked > 0) {
            throw new exceptions_1.BadRequestException(`Sorry, you have been blocked from requesting new OTPs.while you are blocked. Please try again after ${isBlocked} seconds`);
        }
        const remainingOtpTTL = await this.redis.ttl(this.redis.otpKey({ email, subject }));
        if (remainingOtpTTL > 0) {
            throw new exceptions_1.BadRequestException(`Sorry, you cannot request a new OTP while the current OTP is still valid. Please try again after ${remainingOtpTTL} seconds`);
        }
        // Check the number of resend attempts and block if it exceeds the limit
        const maxtrial = Number((await this.redis.get(this.redis.maxAttemptOtpKey({ email, subject }))) ||
            0);
        if (maxtrial >= 3) {
            await this.redis.set({
                key: this.redis.blockOtpKey({ email, subject }),
                value: 1,
                ttl: 7 * 60,
            });
            throw new exceptions_1.BadRequestException(`Sorry, you have exceeded the maximum number of OTP resend attempts. Please try again after 7 minutes`);
        }
        const code = await (0, otp_1.createRandomOtp)();
        await this.redis.set({
            key: this.redis.otpKey({ email, subject }),
            value: await (0, security_1.generateHash)({
                plaintext: `${code}`,
            }),
            ttl: 120,
        });
        email_1.emailEvent.emit("sendEmail", async () => {
            await (0, email_1.sendEmail)({
                to: email,
                subject,
                html: (0, email_1.emailTemplate)({ code, title }),
            });
            await this.redis.incr(this.redis.maxAttemptOtpKey({ email, subject }));
        });
    }
    async signup({ email, username, password, phone, }) {
        const checUserExist = await this.userRepository.findOne({
            filter: { email },
            projection: email,
            options: { lean: true },
        });
        if (checUserExist) {
            throw new exceptions_1.ConflictException("User already exist");
        }
        const user = await this.userRepository.createOne({
            data: {
                email,
                username,
                password: await (0, security_1.generateHash)({ plaintext: password }),
                phone: phone ? await (0, security_1.generateEncryption)(phone) : undefined,
            },
        });
        if (!user) {
            throw new exceptions_1.BadRequestException("Fail");
        }
        await this.sendEmailOtp({
            email,
            subject: enums_1.EmailEnum.CONFIRM_EMAIL,
            title: "verify Your Email",
        });
        return user.toJSON();
    }
    async confirmEmail({ email, otp }) {
        const account = await this.userRepository.findOne({
            filter: {
                email,
                $or: [{ confirmEmail: { $exists: false } }, { confirmEmail: null }],
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!account) {
            throw new exceptions_1.NotFoundException("Account not found or already confirmed");
        }
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: enums_1.EmailEnum.CONFIRM_EMAIL }));
        if (!hashOtp) {
            throw new exceptions_1.NotFoundException("OTP expired");
        }
        if (!(await (0, security_2.compareHash)({
            plaintext: otp,
            ciphertext: hashOtp,
        }))) {
            throw new exceptions_1.ConflictException("Invalid OTP");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(this.redis.otpKey({ email, subject: enums_1.EmailEnum.CONFIRM_EMAIL }));
        return account;
    }
    // resend confirm email if OTP expired
    async resendConfirmEmail({ email }) {
        const account = await this.userRepository.findOne({
            filter: {
                email,
                $or: [{ confirmEmail: { $exists: false } }, { confirmEmail: null }],
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!account) {
            throw new exceptions_1.NotFoundException("Account not found or already confirmed");
        }
        await this.sendEmailOtp({
            email,
            subject: enums_1.EmailEnum.CONFIRM_EMAIL,
            title: "Verify your email for Saraha account",
        });
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();
