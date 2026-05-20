"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFields = void 0;
const zod_1 = require("zod");
//we make it as we will use them more than one time to make our wokr easier and to avoid code duplication 
exports.generalValidationFields = {
    email: zod_1.z.email(),
    phone: zod_1.z.string({ error: "Phone is required" })
        .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/),
    otp: zod_1.z.string({ error: "otp is required" })
        .regex(/^\d{6}$/),
    password: zod_1.z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/, { error: "Weak password" }),
    username: zod_1.z.string({ error: "Username is mandatory" }).min(2, { error: "min is 2 char" }).max(25, { error: "max is 25 char" }),
    confirmPassword: zod_1.z.string({ error: "Confirm password is mandatory" }),
    file: function (mimetype) {
        return zod_1.z.strictObject({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimetype),
            size: zod_1.z.number().max(5 * 1024 * 1024, { message: "File size should not exceed 5MB" }),
            buffer: zod_1.z.any().optional(), // we make it optional because in some cases we may not need to validate the file buffer and we just want to validate the file metadata like mimetype and size
            path: zod_1.z.string().optional() // we make it optional because in some cases we may not have the file path in the request and we just want to validate the file metadata like mimetype and size
        }).superRefine((args, ctx) => {
            if (!args.path && !args.buffer) {
                ctx.addIssue({
                    code: "custom",
                    path: ['buffer'],
                    message: "buffer is required ",
                });
            }
        });
    }
};
