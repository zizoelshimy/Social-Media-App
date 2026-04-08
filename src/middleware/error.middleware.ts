import type {Request,Response, NextFunction } from "express";
interface IEror extends Error{
statusCode:number
}
export const globalErrorHandler = (error:IEror,req:Request,res:Response,next:NextFunction) =>{
    const statusCode=error.statusCode || 500;
    return res.status(statusCode).json({ 
        message: error.message || "internal server error",
         error ,
         cause: error.cause ,
         stack: error.stack
        });
}