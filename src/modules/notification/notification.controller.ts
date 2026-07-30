import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { authentication, authorization, validation } from "../../middleware";
import { RoleEnum, TokenTypeEnum } from "../../common/enums";
import { successResponse } from "../../common/response";
import { notificationService } from "./notification.service";
import * as validators from "./notification.validation";

const router = Router();

router.get(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await notificationService.listNotifications(req.user);
    return successResponse({ res, data });
  },
);

router.get(
  "/:notificationId",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.notificationParams),
  async (req: Request, res: Response, next: NextFunction) => {
    const { notificationId } = req.params as { notificationId: string };
    const data = await notificationService.getNotification(notificationId, req.user);
    return successResponse({ res, data });
  },
);

router.post(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  authorization([RoleEnum.ADMIN]),
  validation(validators.createNotification),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await notificationService.createNotification(req.body, req.user);
    return successResponse({ res, message: "Notification created successfully", data });
  },
);

router.patch(
  "/:notificationId/read",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.notificationParams),
  async (req: Request, res: Response, next: NextFunction) => {
    const { notificationId } = req.params as { notificationId: string };
    const data = await notificationService.markAsRead(notificationId, req.user);
    return successResponse({ res, data });
  },
);

router.delete(
  "/:notificationId",
  authentication(TokenTypeEnum.ACCESS),
  authorization([RoleEnum.ADMIN]),
  validation(validators.notificationParams),
  async (req: Request, res: Response, next: NextFunction) => {
    const { notificationId } = req.params as { notificationId: string };
    const data = await notificationService.deleteNotification(notificationId, req.user);
    return successResponse({ res, data });
  },
);

export default router;