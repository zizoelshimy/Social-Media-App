import { z } from "zod";
import { generalValidationFields } from "../../common/validation";

export const resendConfirmEmail = {
  body: z.strictObject({
    email: generalValidationFields.email,
  }),
};

export const confirmEmail = {
  body: resendConfirmEmail.body.safeExtend({
      otp: generalValidationFields.otp,
    })
};

export const login = {
  body: z
    .strictObject({
      email: generalValidationFields.email,
      password: generalValidationFields.password,
    })
    .catchall(z.string()),
};

export const signup = {
  body: login.body
    .safeExtend({
      username: generalValidationFields.username,
      phone: generalValidationFields.phone.optional(),
      confirmPassword: generalValidationFields.confirmPassword,
    })
    .refine(
      (data) => {
        return data.password === data.confirmPassword;
      },
      {
        message: "Passwords don't match",
      },
    ),
};
