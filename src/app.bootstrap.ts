import express from "express"; 
import type{ Request,  Response, NextFunction} from "express"; 
import { authRouter, userRouter } from "./modules";
import { globalErrorHandler } from "./middleware";
import { PORT } from "./config/config";
import connectDB from "./DB/connection.db";
import redisService from "./common/services/redis.service";
import cors from "cors";
import { notificationService, s3Service } from "./common/services";
import("./DB/repository/base.repository.js")
import {pipeline} from 'node:stream'
import { promisify } from "node:util";
import { successResponse } from "./common/response";
const s3WriteStream = promisify(pipeline)
 const bootstrap=async ():Promise<void>=>{
    const app:express.Express=express();
    app.use(express.json(),cors())
    app.get("/",(req:Request,res:Response,next:NextFunction)=>{
       res.status(200).json({message:"Welcome to Social Media App"})
    })

 /*    app.post("/send-notification",async (req:Request,res:Response,next:NextFunction):Promise<express.Response>=>{
      console.log({token:req.body.token}) 
      await notificationService.sendNotification({
        token:req.body.token,
        data:{
          title:"Hello from Social Media App",
          body:"This is a test notification"
        } 
      })
      return res.status(200).json({message:"Welcome to Social Media App"})
    }) */
    //applying routing
    app.use("/auth",authRouter)
    app.use("/user",userRouter)



    app.get("/uploads/*path", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { download, fileName } = req.query as { download: string, fileName: string }
  const { path } = req.params as { path: string[] }
  const Key = path.join("/")
  const { Body, ContentType } = await s3Service.getAssets({ Key })
  console.log({ Body, ContentType });
  res.setHeader(
    "Content-Type",
    ContentType || "application/octet-stream"
  );
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  if (download === "true") {
    res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`); // only app
  }

  return await s3WriteStream(Body as NodeJS.ReadableStream, res)
})
 app.get("/pre-signed/*path", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { download, fileName } = req.query as { download: string, fileName: string }
  const { path } = req.params as { path: string[] }
  const Key = path.join("/")
  const url = await s3Service.createPresignedFethcLink({ Key,download, fileName  })
   return successResponse({res,data: {url}}) 
})

       app.get("/*dummy",(req:express.Request,res:express.Response,next:express.NextFunction)=>{
       res.status(404).json({message:"invalid routing"})
    })
    //connecting the database
    await connectDB()
    await redisService.connect()
 

    //application-error
    app.use(globalErrorHandler)
     app.listen(PORT,()=>{
         console.log(`Server is running on port ${PORT}`)
     })
    console.log("Application bootstrapped successfully ")
 }
 export default bootstrap   