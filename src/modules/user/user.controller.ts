import { type NextFunction, Router } from "express";
import type { Request, Response } from "express";
import { successResponse } from "../../common/response";
import UserService from "./user.service";
import { authentication, authorization } from "../../middleware";
import { TokenTypeEnum } from "../../common/enums";
import { endpoint } from "./user.authorization";
const router = Router();
const userService = new UserService();

router.get("/",
    authentication(TokenTypeEnum.ACCESS),
    authorization(endpoint.profile),
    async (req:Request, res:Response,next:NextFunction) => {
  const data=  await userService.profile(req.user)
     return successResponse({
        res,
        data
     })
})

//logout
router.post("/logout", authentication(TokenTypeEnum.ACCESS), async (req, res, next) => {
  const status = await userService.logout(req.body, req.user, req.decoded as { jti: string, iat: number, sub: string });
  return successResponse({
    res,
    message: "Logged out successfully",
    data: { status },
  });
});

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESH),
  async (req, res, next) => {
    const credentials = await userService.rotateToken(
      req.user,
      req.decoded as { jti: string, iat: number, sub: string },
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



export default router;