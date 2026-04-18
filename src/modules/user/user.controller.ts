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



export default router;