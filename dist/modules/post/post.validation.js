"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePost = exports.reactPost = exports.createPost = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/enums");
const mongoose_1 = require("mongoose");
const validation_1 = require("../../common/validation");
const multer_1 = require("../../common/utils/multer");
exports.createPost = {
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
        attachments: zod_1.z.array(zod_1.z.any()).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        avalibility: zod_1.z.coerce.number().default(enums_1.AvailabilityEnum.PUBLIC),
        files: zod_1.z.array(validation_1.generalValidationFields.file(multer_1.fileFieldValidation.image)).optional()
    }).superRefine((args, ctx) => {
        if (!args.attachments?.length && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required if attachments are not provided",
            });
        }
        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length !== args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Dublicate tags are not allowed",
                });
            }
            for (const tag of args.tags) {
                if (!mongoose_1.Types.ObjectId.isValid(tag)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: `Invalid tag id: ${tag}`,
                    });
                }
            }
        }
    })
};
exports.reactPost = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id
    }),
    query: zod_1.z.object({
        react: zod_1.z.coerce.number()
    })
};
exports.updatePost = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
        attachments: zod_1.z.array(zod_1.z.any()).optional(),
        tags: zod_1.z.array(validation_1.generalValidationFields.id).optional(),
        avalibility: zod_1.z.coerce.number().optional(),
        files: zod_1.z.array(validation_1.generalValidationFields.file(multer_1.fileFieldValidation.image)).optional(),
        removeFiles: zod_1.z.array(zod_1.z.string()).optional(),
        removeTags: zod_1.z.array(zod_1.z.string()).optional()
    }).superRefine((args, ctx) => {
        if (!Object.values(args)?.length) {
            ctx.addIssue({
                code: "custom",
                message: "insert data to update",
            });
        }
        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length !== args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Dublicate tags are not allowed",
                });
            }
        }
    })
};
