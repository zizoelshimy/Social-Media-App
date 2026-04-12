"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const repository_1 = require("../../DB/repository");
const exceptions_1 = require("../../common/exceptions");
const security_1 = require("../../common/utils/security");
const email_1 = require("../../common/utils/email");
class AuthenticationService {
    userRepository;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
    }
    login(data) {
        return data;
    }
    // the in to db is raw data and the out data is hydrated wit recpect to the service and the out to front is raw data to can not update it 
    async signup({ email, username, password, phone }) {
        const checUserExist = await this.userRepository.findOne({
            filter: { email },
            projection: email,
            options: { lean: true }
        });
        if (checUserExist) {
            throw new exceptions_1.ConflictException("User already exist");
        }
        const user = await this.userRepository.createOne({
            data: {
                email,
                username,
                password: await (0, security_1.generateHash)({ plaintext: password }),
                phone: phone ? await (0, security_1.generateEncryption)(phone) : undefined
            }
        });
        if (!user) {
            throw new exceptions_1.BadRequestException("Fail");
        }
        await (0, email_1.sendEmail)({
            to: email,
            subject: "Confirmation Email",
            html: (0, email_1.emailTemplate)({ code: 123456, title: "Verify account" }),
        });
        return user.toJSON();
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService;
