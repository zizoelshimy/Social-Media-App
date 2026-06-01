"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComment = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
const multer_1 = require("../../common/utils/multer");
exports.createComment = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
        attachments: zod_1.z.array(zod_1.z.any()).optional(),
        tags: zod_1.z.array(validation_1.generalValidationFields.id).optional(),
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
        }
    })
};
