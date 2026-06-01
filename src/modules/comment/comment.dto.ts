import { z } from "zod";
import { createComment } from "./comment.validation";
export type CreateCommentBodyDto = z.infer<typeof createComment.body>;
export type CreateCommentParamsDto = z.infer<typeof createComment.params>;
