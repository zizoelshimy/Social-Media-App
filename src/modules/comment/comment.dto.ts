import { z } from "zod";
import { createComment } from "./comment.validation";
export type CreateCommentBodyDto = z.infer<typeof createComment.body>;
export type CreateCommentParamsDto = z.infer<typeof createComment.params>;

export type UpdateCommentBodyDto = { content?: string };
export type UpdateCommentParamsDto = { postId: string; commentId: string };
export type CommentParamsDto = { postId: string; commentId: string };
