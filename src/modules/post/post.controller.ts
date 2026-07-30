import { Router } from "express";
import { authentication, validation } from "../../middleware";
import { cloudFileUpload, fileFieldValidation } from "../../common/utils/multer";
import { TokenTypeEnum } from "../../common/enums";
import { successResponse } from "../../common/response";
import type{ Request, Response,NextFunction } from "express";
import * as validators from "./post.validation"
import { postService } from "./post.service";
import { PaginateDto, paginationValidationSchema } from "../../common/validation";
import { ReactPostParamsDto, ReactPostQueryDto, UpdatePostBodyDto, UpdatePostParamsDto } from "./post.dto";
import { commentRouter } from "../comment";
const router =Router()
router.use('/:postId/comments', commentRouter )

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

router.get("/dashboard",
    authentication(TokenTypeEnum.ACCESS),
    validation(paginationValidationSchema),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const data=await postService.dashboardFeed(req.query as PaginateDto,req.user)
return successResponse({res,message:"Dashboard feed retrieved successfully",data})
}
)

router.get("/:postId",
    authentication(TokenTypeEnum.ACCESS),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const { postId } = req.params as { postId: string };
    const data=await postService.getPost(postId,req.user)
return successResponse({res,message:"Post retrieved successfully",data})
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

router.delete("/:postId",
    authentication(TokenTypeEnum.ACCESS),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const { postId } = req.params as { postId: string };
    const data=await postService.deletePost(postId,req.user,false)
return successResponse({res,message:"Post deleted successfully",data})
}
)

router.delete("/:postId/hard",
    authentication(TokenTypeEnum.ACCESS),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const { postId } = req.params as { postId: string };
    const data=await postService.deletePost(postId,req.user,true)
return successResponse({res,message:"Post hard deleted successfully",data})
}
)

router.patch("/:postId/restore",
    authentication(TokenTypeEnum.ACCESS),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const { postId } = req.params as { postId: string };
    const data=await postService.restorePost(postId,req.user)
return successResponse({res,message:"Post restored successfully",data})
}
)
//update posts 
router.patch("/:postId",
    authentication(TokenTypeEnum.ACCESS),
    cloudFileUpload({validation:fileFieldValidation.image}).array("attachments",2),
   validation(validators.updatePost),
   async (req:Request,res:Response,next:NextFunction):Promise<Response>=>{
    const data=await postService.updatePost(req.params as UpdatePostParamsDto,req.body as UpdatePostBodyDto,req.user)
return successResponse({res,message:"Post updated successfully",data})
}
)

export default router