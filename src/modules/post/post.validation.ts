import {z} from "zod"
import { AvailabilityEnum } from "../../common/enums"
import { Types } from "mongoose";
import { generalValidationFields } from "../../common/validation";
import { fileFieldValidation } from "../../common/utils/multer";

export const createPost ={
    body:z.object({
        content : z.string().optional(),
        attachments : z.array(z.any()).optional(),
        tags : z.array(z.string()).optional(),
        avalibility : z.coerce.number().default(AvailabilityEnum.PUBLIC),
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
            for(const tag of args.tags){
                if(!Types.ObjectId.isValid(tag)){
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: `Invalid tag id: ${tag}`,
                    })
                }
            }
        }
    })
}

export const reactPost ={
    params:z.strictObject({
        postId:generalValidationFields.id
    }),
    query:z.object({
      react:z.coerce.number().optional(),
      emoji:z.string().optional()
    })
}

export const postParams = {
    params:z.strictObject({
        postId:generalValidationFields.id
    })
}

export const updatePost ={
     params:z.strictObject({
        postId:generalValidationFields.id
    }),
    body:z.object({
        content : z.string().optional(),
        attachments : z.array(z.any()).optional(),
        tags : z.array(generalValidationFields.id).optional(),
        avalibility : z.coerce.number().optional(),
        files:z.array(generalValidationFields.file(fileFieldValidation.image)).optional(),
        removeFiles:z.array(z.string()).optional(),
        removeTags:z.array(z.string()).optional()
    }).superRefine((args,ctx)=>{
        if (!Object.values(args)?.length) {
            ctx.addIssue({
                code: "custom",
                message: "insert data to update",
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