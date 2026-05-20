import {z} from "zod"
import { createPost } from "./post.validation"
export type CreatePostBodyDto = z.infer<typeof createPost.body>