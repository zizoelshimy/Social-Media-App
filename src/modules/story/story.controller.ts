import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { authentication, validation } from "../../middleware";
import { TokenTypeEnum } from "../../common/enums";
import { successResponse } from "../../common/response";
import { storyService } from "./story.service";
import * as validators from "./story.validation";

const router = Router();

router.get(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await storyService.storyList(req.user);
    return successResponse({ res, data });
  },
);

router.post(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.createStory),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await storyService.createStory(req.body, req.user);
    return successResponse({
      res,
      message: "Story created successfully",
      data,
    });
  },
);

router.delete(
  "/:storyId",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.storyParams),
  async (req: Request, res: Response, next: NextFunction) => {
    const { storyId } = req.params as { storyId: string };
    const data = await storyService.deleteStory(storyId, req.user);
    return successResponse({
      res,
      message: "Story deleted successfully",
      data,
    });
  },
);

export default router;
