import { type NextFunction, Router } from "express";
import type { Request, Response } from "express";
import { successResponse } from "../../common/response";
import UserService from "./user.service";
import { authentication, authorization, validation } from "../../middleware";
import { StorageApproachEnum, TokenTypeEnum } from "../../common/enums";
import { endpoint } from "./user.authorization";
import {
  cloudFileUpload,
  fileFieldValidation,
} from "../../common/utils/multer";
import * as validators from "./user.validation";
const router = Router();
const userService = new UserService();

router.get(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  authorization(endpoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.profile(req.user);
    return successResponse({
      res,
      data,
    });
  },
);

router.patch(
  "/profile",
  authentication(TokenTypeEnum.ACCESS),
  validation(validators.updateProfile),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.updateProfile(req.body, req.user);
    return successResponse({ res, data });
  },
);

router.get(
  "/:userId/posts",
  authentication(TokenTypeEnum.ACCESS),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params as { userId: string };
    const data = await userService.profilePosts(userId, req.user);
    return successResponse({ res, data });
  },
);

router.patch(
  "/profile-image",
  authentication(TokenTypeEnum.ACCESS),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.profileImage(req.body, req.user);
    return successResponse({res,data: data,});
  },
);

router.patch(
  "/profile-cover-images",
  authentication(TokenTypeEnum.ACCESS),
  cloudFileUpload({
    validation: fileFieldValidation.image,
    storageApproach: StorageApproachEnum.DISK,
    maxSize: 2,
  }).fields([
    { name: "attachments", maxCount: 2 },
    { name: "attachment", maxCount: 2 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    const uploadedFiles = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const files = [
      ...(uploadedFiles?.attachments ?? []),
      ...(uploadedFiles?.attachment ?? []),
    ];

    const data = await userService.profileCoverImages(files, req.user);
    return successResponse({
      res,
      data: data,
    });
  },
);

//logout
router.post(
  "/logout",
  authentication(TokenTypeEnum.ACCESS),
  async (req, res, next) => {
    const status = await userService.logout(
      req.body,
      req.user,
      req.decoded as { jti: string; iat: number; sub: string },
    );
    return successResponse({
      res,
      message: "Logged out successfully",
      data: { status },
    });
  },
);

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESH),
  async (req, res, next) => {
    const credentials = await userService.rotateToken(
      req.user,
      req.decoded as { jti: string; iat: number; sub: string },
      `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    ); //to know the issuer of the token which is the url of the rotate-token endpoint
    return successResponse({
      res,
      status: 201,
      message: "Token rotated successfully",
      data: credentials,
    });
  },
);

router.delete(
  "/",
  authentication(TokenTypeEnum.ACCESS),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.deleteProfile(req.user);
    return successResponse({res,data: data});
  },
);

/* router.patch(
  "/profile-image",
  authentication(TokenTypeEnum.ACCESS),
  cloudFileUpload({
    validation: fileFieldValidation.image,
    storageApproach: StorageApproachEnum.DISK,
    maxSize: 2,
  }).single("attachment"),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.profileImage(
      req.file as Express.Multer.File,
      req.user,
    );
    return successResponse({
      res,
      data: data,
    });
  },
); */
export default router;
