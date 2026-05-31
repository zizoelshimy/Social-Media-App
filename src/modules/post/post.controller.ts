import { Router } from "express";
import { authentication, validation } from "../../middleware";
import { cloudFileUpload, fileFieldValidation } from "../../common/utils/multer";
import { TokenTypeEnum } from "../../common/enums";
import { successResponse } from "../../common/response";
import type{ Request, Response,NextFunction } from "express";
import * as validators from "./post.validation"
import { postService } from "./post.service";
import { PaginateDto, paginationValidationSchema } from "../../common/validation";
import { ReactPostParamsDto, ReactPostQueryDto } from "./post.dto";
const router =Router()

router.post("/",
    authentication(TokenTypeEnum.ACCESS),
    cloudFileUpload({validation:fileFieldValidation.image}).array("attachments",2),
   validation(validators.createPost),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const data=await postService.createPost({...req.body,files:req.files},req.user)
return successResponse({res,message:"Post created successfully",data})
}
)

router.get("/",
    authentication(TokenTypeEnum.ACCESS),
    validation(paginationValidationSchema),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const data=await postService.postList(req.query as PaginateDto,req.user)
return successResponse({res,message:"Posts retrieved successfully",data})
}
)

router.patch("/:postId/react",
    authentication(TokenTypeEnum.ACCESS),
   validation(validators.reactPost),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const data=await postService.reactPost(req.params as ReactPostParamsDto,req.query as unknown as ReactPostQueryDto,req.user)
return successResponse({res,message:"Post reacted successfully",data})
}
)

export default router