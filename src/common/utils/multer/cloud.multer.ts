import multer from "multer"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { Request } from "express"
import { StorageApproachEnum } from "../../enums"
import { validation } from "../../../middleware"
import { fileFilter } from "./validation.multer"
export const cloudFileUpload= ({
    storageApproach=StorageApproachEnum.MEMORY,
    validation=[],
    maxSize=2
}:{
    storageApproach?: StorageApproachEnum,
    validation ?: string[],
    maxSize ?: number
})=>{

   // const storage = multer.memoryStorage()
   const storage = storageApproach === StorageApproachEnum.MEMORY ? multer.memoryStorage() : multer.diskStorage({
    destination:function (req:Request, file:Express.Multer.File, cb: (error: Error | null, destination: string) => void)  {
      cb(null, tmpdir())
    },
    filename:function (req:Request, file:Express.Multer.File, cb: (error: Error | null, filename: string) => void)  {    
      cb(null, `${randomUUID()}__${file.originalname}`)
    }
   })
    return multer({fileFilter: fileFilter(validation), storage:storage, limits:{fileSize:maxSize*1024*1024}})
}