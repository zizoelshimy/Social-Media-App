import { z } from "zod";

//we make it as we will use them more than one time to make our wokr easier and to avoid code duplication 
export const generalValidationFields = {
    email: z.email(),
    phone: z.string({ error: "Phone is required" })
  .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/),
  otp: z.string({ error: "otp is required" })
  .regex(/^\d{6}$/),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/,{error:"Weak password"}),
    username: z.string({error: "Username is mandatory"}).min(2,{error:"min is 2 char"}).max(25,{error:"max is 25 char"}),
    confirmPassword: z.string({error: "Confirm password is mandatory"})
}
