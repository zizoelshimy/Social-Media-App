"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = exports.login = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.login = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFields.email,
        password: validation_1.generalValidationFields.password,
    }).catchall(zod_1.z.string())
};
exports.signup = {
    body: exports.login.body.safeExtend({
        username: validation_1.generalValidationFields.username,
        confirmPassword: validation_1.generalValidationFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, {
        message: "Passwords don't match",
    }),
};
