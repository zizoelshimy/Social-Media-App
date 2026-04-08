import {type Response } from "express";
export const successResponse = <T>({
res,
message="Success",
status=200,
data
}:{
    res:Response,
    message?:string,
    status?:number,
    data?:any
})=>{
return res.status(status).json({
    message,
    status,
    data
})
}