import { RedisClientType } from "redis";
import { createClient } from "redis";
import { REDIS_URI } from "../../config/config";
import { EmailEnum } from "../enums/email.enum";
import { Types } from "mongoose";
type RedisKeyType ={email:string,subject?:EmailEnum,content?:string}
export class RedisService {
    private readonly client:RedisClientType
    constructor() {
       this.client = createClient({url:REDIS_URI})
         this.handelEvents()
    }
    private async handelEvents(){
        this.client.on("error",(err)=>{
            console.log(`Redis Client Error ,,,${err}`)
        })
           this.client.on("ready",(err)=>{
            console.log(`Redis Is Ready ,,,`)
        })
    }
    public async connect() {
        await this.client.connect()
        console.log(`Redis Is Connected`)
    }
otpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: RedisKeyType): string => {
  return `OTP::User::${email}::${subject}`
}

maxAttemptOtpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: RedisKeyType): string => {
  return `${this.otpKey({ email, subject })}::MaxTrial`
}

blockOtpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: RedisKeyType): string => {
  return `${this.otpKey({ email, subject })}::Block`
}

baseRevokeTokenKey = (userId: Types.ObjectId | string): string => {
  return `RevokeToken::${userId.toString()}`
}

revokeTokenKey = ({ userId, jti }: { userId: Types.ObjectId | string; jti: string }): string => {
  return `${this.baseRevokeTokenKey(userId)}::${jti}`
}


    set=   async ({
    key,
    value,
    ttl
}:{
    key:string,
    value:any,
    ttl?:number | undefined
}):Promise<string | null>=>{
    try {
        let data =typeof value==='string'?value:JSON.stringify(value); 
        return ttl? await this.client.set(key,data,{EX:ttl}): await this.client.set(key,data);
    }   catch (error) {
        console.log(`field in Redis set operations ${error}`);
        return null;
    }
}

 update=   async ({
    key,
    value,
    ttl
}:{
    key:string,
    value:string|object,
    ttl?:number | undefined
}):Promise<string|number | null>=>{
    try {
        if(!await this.client.exists(key)) {
            return 0;
        }
        return await this.set({key,value,ttl})
    }   catch (error) {
        console.log(`field in Redis update operations ${error}`);
        return null;
    }

}

 get=   async (key:string):Promise<any>=>{
    try {
        try {
            return JSON.parse(await this.client.get(key) as string);
        } catch (error) {
             return await this.client.get(key);
        }
    }   catch (error) {
        console.log(`field in Redis get   operations ${error}`);
        return 
    }
}


 ttl=   async (key:string):Promise<number>=>{
    try {
        return await this.client.ttl(key);
    }   catch (error) {
        console.log(`field in Redis ttl   operations ${error}`);
        return -2;

    }
}
 incr=   async (key:string):Promise<number>=>{
    try {
        return await this.client.incr(key);
    }   catch (error) {
        console.log(`field in Redis incr   operations ${error}`);
        return -2;
    }
}
 exists=   async (key:string):Promise<number>=>{
    try {
        return await this.client.exists(key);
    }   catch (error) {
        console.log(`field in Redis exists   operations ${error}`);
        return -2;
    }
}

 expire=   async (
    {
    key, ttl
    }:{
        key:string,
        ttl:number
    }):Promise<number>=>{
    try {
        return await this.client.expire(key, ttl);
    }   catch (error) {
        console.log(`field in Redis add-expire   operations ${error}`);
        return 0;
    }
}

 mGet= async (keys:string[]):Promise<string[] |number| null>=>{
    try {
        if(!keys.length) return 0; 
        return await this.client.mGet(keys) as string[];
    }   catch (error) {
        console.log(`field in Redis mget  operations ${error}`);
        return []
    }
}

 keys=   async (prefix:string):Promise<string[]>=>{
 try {      
        return await this.client.keys(`${prefix}*`);
    }   catch (error) {
        console.log(`field in Redis keys  operations ${error}`);
        return [];
    }
}
 deleteKey=   async (key:string|string[]):Promise<number>=>{
    try {
        if(!key.length) return 0;
        return await this.client.del(key);
    }   catch (error) {
        console.log(`field in Redis delete operations ${error}`);
        return 0;  
    }
}
}
const redisService = new RedisService()
export default redisService