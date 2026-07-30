import { z } from "zod";

export const updateProfile = {
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    DOB: z.coerce.date().optional(),
    profilePicture: z.string().optional(),
    profileCoverPictures: z.array(z.string()).optional(),
  }),
};
