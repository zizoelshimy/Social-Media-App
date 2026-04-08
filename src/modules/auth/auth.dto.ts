
import { z } from "zod";
import { login, signup } from "./auth.validation";

export type LoginDto=z.infer<typeof login.body>; //we can use it instead on writing the same thing agin we can take it from the sign up schema 
export type SignUpDto=z.infer<typeof signup.body>; //we can use it instead on writing the same thing agin we can take it from the sign up schema 