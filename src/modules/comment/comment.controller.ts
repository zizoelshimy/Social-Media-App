import { Router } from "express";
import { authentication, validation } from "../../middleware";
import {
  cloudFileUpload,
  fileFieldValidation,
} from "../../common/utils/multer";
import { TokenTypeEnum } from "../../common/enums";
import { successResponse } from "../../common/response";
import type { Request, Response, NextFunction } from "express";
import * as validators from "./comment.validation";
import { commentService } from "./comment.service";
import { CreateCommentParamsDto } from "./comment.dto";
import { IComment } from "../../common/interfaces";
const router = Router({ mergeParams: true });

router.post(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  cloudFileUpload({ validation: fileFieldValidation.image }).array(
    "attachments",
    2,
  ),
  validation(validators.createComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.createComment(
      req.params as CreateCommentParamsDto,
      { ...req.body, files: req.files },
      req.user,
    );
    return successResponse<IComment>({
      res,
      message: "Comment created successfully",
      data,
    });
  },
);

router.get(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const { postId } = req.params as { postId: string };
    const data = await commentService.commentList(postId, req.user);
    return successResponse<IComment[]>({
      res,
      message: "Comments retrieved successfully",
      data,
    });
  },
);

router.get(
  "/:commentId",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.commentParams),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const { postId, commentId } = req.params as {
      postId: string;
      commentId: string;
    };
    const data = await commentService.getComment(postId, commentId, req.user);
    return successResponse<IComment>({
      res,
      message: "Comment retrieved successfully",
      data,
    });
  },
);

router.patch(
  "/:commentId",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.updateComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const { postId, commentId } = req.params as {
      postId: string;
      commentId: string;
    };
    const data = await commentService.updateComment(
      postId,
      commentId,
      req.body,
      req.user,
    );
    return successResponse<IComment>({
      res,
      message: "Comment updated successfully",
      data,
    });
  },
);

router.delete(
  "/:commentId",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.commentParams),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const { postId, commentId } = req.params as {
      postId: string;
      commentId: string;
    };
    const data = await commentService.deleteComment(
      postId,
      commentId,
      req.user,
      false,
    );
    return successResponse({
      res,
      message: "Comment deleted successfully",
      data,
    });
  },
);

router.delete(
  "/:commentId/hard",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.commentParams),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const { postId, commentId } = req.params as {
      postId: string;
      commentId: string;
    };
    const data = await commentService.deleteComment(
      postId,
      commentId,
      req.user,
      true,
    );
    return successResponse({
      res,
      message: "Comment hard deleted successfully",
      data,
    });
  },
);

router.patch(
  "/:commentId/restore",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.commentParams),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const { postId, commentId } = req.params as {
      postId: string;
      commentId: string;
    };
    const data = await commentService.restoreComment(
      postId,
      commentId,
      req.user,
    );
    return successResponse({
      res,
      message: "Comment restored successfully",
      data,
    });
  },
);

export default router;
