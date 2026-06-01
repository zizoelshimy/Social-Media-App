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
import {
  CreateCommentParamsDto,
} from "./comment.dto";
import { IComment } from "../../common/interfaces";
const router = Router({ mergeParams: true });

router.post(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  cloudFileUpload({ validation: fileFieldValidation.image }).array("attachments",2,),
  validation(validators.createComment),
  async (req: Request,res: Response,next: NextFunction,): Promise<Response> => {
    const data = await commentService.createComment(req.params as CreateCommentParamsDto,
      { ...req.body, files: req.files },
      req.user,
    );
    return successResponse<IComment>({ res, message: "Comment created successfully", data });
  },
);

export default router;
