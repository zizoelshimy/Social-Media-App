"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../../common/response");
const user_service_1 = __importDefault(require("./user.service"));
const middleware_1 = require("../../middleware");
const enums_1 = require("../../common/enums");
const user_authorization_1 = require("./user.authorization");
const multer_1 = require("../../common/utils/multer");
const router = (0, express_1.Router)();
const userService = new user_service_1.default();
router.get("/", (0, middleware_1.authentication)(enums_1.TokenTypeEnum.ACCESS), (0, middleware_1.authorization)(user_authorization_1.endpoint.profile), async (req, res, next) => {
    const data = await userService.profile(req.user);
    return (0, response_1.successResponse)({
        res,
        data,
    });
});
router.patch("/profile-image", (0, middleware_1.authentication)(enums_1.TokenTypeEnum.ACCESS), async (req, res, next) => {
    const data = await userService.profileImage(req.body, req.user);
    return (0, response_1.successResponse)({ res, data: data, });
});
router.patch("/profile-cover-images", (0, middleware_1.authentication)(enums_1.TokenTypeEnum.ACCESS), (0, multer_1.cloudFileUpload)({
    validation: multer_1.fileFieldValidation.image,
    storageApproach: enums_1.StorageApproachEnum.DISK,
    maxSize: 2,
}).fields([
    { name: "attachments", maxCount: 2 },
    { name: "attachment", maxCount: 2 },
]), async (req, res, next) => {
    const uploadedFiles = req.files;
    const files = [
        ...(uploadedFiles?.attachments ?? []),
        ...(uploadedFiles?.attachment ?? []),
    ];
    const data = await userService.profileCoverImages(files, req.user);
    return (0, response_1.successResponse)({
        res,
        data: data,
    });
});
//logout
router.post("/logout", (0, middleware_1.authentication)(enums_1.TokenTypeEnum.ACCESS), async (req, res, next) => {
    const status = await userService.logout(req.body, req.user, req.decoded);
    return (0, response_1.successResponse)({
        res,
        message: "Logged out successfully",
        data: { status },
    });
});
router.post("/rotate-token", (0, middleware_1.authentication)(enums_1.TokenTypeEnum.REFRESH), async (req, res, next) => {
    const credentials = await userService.rotateToken(req.user, req.decoded, `${req.protocol}://${req.get("host")}${req.originalUrl}`); //to know the issuer of the token which is the url of the rotate-token endpoint
    return (0, response_1.successResponse)({
        res,
        status: 201,
        message: "Token rotated successfully",
        data: credentials,
    });
});
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
exports.default = router;
