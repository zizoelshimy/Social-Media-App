import { Types } from "mongoose";
import { z } from "zod";

//we make it as we will use them more than one time to make our wokr easier and to avoid code duplication 
export const generalValidationFields = {
    id:z.string().refine(value=>{return Types.ObjectId.isValid(value)},{error:"Invalid id"}),
    email: z.email(),
    phone: z.string({ error: "Phone is required" })
  .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/),
  otp: z.string({ error: "otp is required" })
  .regex(/^\d{6}$/),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/,{error:"Weak password"}),
    username: z.string({error: "Username is mandatory"}).min(2,{error:"min is 2 char"}).max(25,{error:"max is 25 char"}),
    confirmPassword: z.string({error: "Confirm password is mandatory"}),
    file:function(mimetype:string[]){
return z.strictObject({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum(mimetype),
    size: z.number().max(5 * 1024 * 1024, { message: "File size should not exceed 5MB" }),
    buffer: z.any().optional(), // we make it optional because in some cases we may not need to validate the file buffer and we just want to validate the file metadata like mimetype and size
    path: z.string().optional() // we make it optional because in some cases we may not have the file path in the request and we just want to validate the file metadata like mimetype and size
}).superRefine((args, ctx) => {
    if(!args.path && !args.buffer){
        ctx.addIssue({
            code: "custom",
            path:['buffer'],
            message: "buffer is required ",
        })
      }  
    })
    }
}
export const paginationValidationSchema = {
    query: z.strictObject({
        page:z.coerce.number().optional(),
        size:z.coerce.number().optional(),
        search:z.string().optional()
    })
}
export type PaginateDto = z.infer<typeof paginationValidationSchema.query>