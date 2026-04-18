import express from "express"; 
import type{ Request,  Response, NextFunction} from "express"; 
import { authRouter, userRouter } from "./modules";
import { globalErrorHandler } from "./middleware";
import { PORT } from "./config/config";
import connectDB from "./DB/connection.db";
import redisService from "./common/services/redis.service";
import cors from "cors";
 const bootstrap=async ():Promise<void>=>{
    const app:express.Express=express();
    app.use(express.json(),cors())
    app.get("/",(req:Request,res:Response,next:NextFunction)=>{
       res.status(200).json({message:"Welcome to Social Media App"})
    })
    //applying routing
    app.use("/auth",authRouter)
    app.use("/user",userRouter)
       app.get("/*dummy",(req:Request,res:Response,next:NextFunction)=>{
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