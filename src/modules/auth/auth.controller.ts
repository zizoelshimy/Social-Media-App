import { Router, Request, Response, NextFunction } from "express";
import authServise from "./auth.service";
import { successResponse } from "../../common/response";
import * as validtors from "./auth.validation";
import { validation } from "../../middleware";
const router: Router = Router();

router.post(
  "/login",
  validation(validtors.login),
  async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await authServise.login(req.body, `${req.protocol}://${req.host}`)
    return successResponse<{ access_token: string; refresh_token: string }>({ res, data })
  }
)

router.post(
  "/signup",
  validation(validtors.signup),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await authServise.signup(req.body);
      successResponse<any>({
        //we get it from the auth.entity file
        res,
        status: 201,
        data,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

router.patch(
  "/confirm-email",
  validation(validtors.confirmEmail),
  async (req, res, next) => {
    const user = await authServise.confirmEmail(req.body);
    return successResponse({
      res,
      status: 201,
      message: "Email confirmed successfully",
      data: user,
    });
  },
);

router.patch(
  "/resend-confirm-email",
  validation(validtors.resendConfirmEmail),
  async (req, res, next) => {
    const user = await authServise.resendConfirmEmail(req.body);
    return successResponse({
      res,
      status: 201,
      message: "OTP resent successfully",
      data: user,
    });
  },
);
export default router;
