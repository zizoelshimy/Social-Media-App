import {z} from "zod"
import { createPost, reactPost } from "./post.validation"
export type CreatePostBodyDto = z.infer<typeof createPost.body>
export type ReactPostQueryDto = z.infer<typeof reactPost.query>
export type ReactPostParamsDto = z.infer<typeof reactPost.params>