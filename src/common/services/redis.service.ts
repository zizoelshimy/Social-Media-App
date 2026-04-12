import { RedisClientType } from "redis";
import { createClient } from "redis";
import { REDIS_URI } from "../../config/config";

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
}
const redisService = new RedisService()
export default redisService