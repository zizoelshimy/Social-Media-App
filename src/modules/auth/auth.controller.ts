import { Router,Request ,Response,NextFunction} from "express";
import  authServise from "./auth.service";
import { successResponse } from "../../common/response";
import { ILoginResponse } from "./auth.entity";
import * as validtors from "./auth.validation";
import { validation } from "../../middleware";
const router: Router = Router();

router.post("/login",
    validation(validtors.login),
     (req:Request, res:Response,next:NextFunction):Response => {
    
    const data=authServise.login(req.body)
    return successResponse<ILoginResponse>({ //we get it from the auth.entity file
        res, 
        data
    })
})

router.post("/signup",
    validation(validtors.signup),
     async(req:Request, res:Response,next:NextFunction):Promise<Response> => {
    const data=await authServise.signup(req.body)
    return successResponse<any>({ //we get it from the auth.entity file
        res,
        status:201,
        data
    })
})
export default router;