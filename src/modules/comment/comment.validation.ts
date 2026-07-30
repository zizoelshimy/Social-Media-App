import {z} from "zod"
import { generalValidationFields} from "../../common/validation";
import { fileFieldValidation } from "../../common/utils/multer";

export const createComment ={
     params:z.strictObject({
        postId:generalValidationFields.id
    }),     
    body:z.object({
        content : z.string().optional(),
        attachments : z.array(z.any()).optional(),
        tags : z.array(generalValidationFields.id).optional(),  
        files:z.array(generalValidationFields.file(fileFieldValidation.image)).optional()
    }).superRefine((args,ctx)=>{
        if (!args.attachments?.length && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required if attachments are not provided",
            });
        }
        if (args.tags?.length ) {
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length !== args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Dublicate tags are not allowed",
                })
            }
        }
    })
}

export const commentParams = {
    params:z.strictObject({
        postId:generalValidationFields.id,
        commentId:generalValidationFields.id,
    })
}

export const updateComment = {
    params: z.strictObject({
        postId: generalValidationFields.id,
        commentId: generalValidationFields.id,
    }),
    body: z.object({
        content: z.string().optional(),
    })
}

