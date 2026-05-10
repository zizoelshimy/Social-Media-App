"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const middleware_1 = require("./middleware");
const config_1 = require("./config/config");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const redis_service_1 = __importDefault(require("./common/services/redis.service"));
const cors_1 = __importDefault(require("cors"));
const services_1 = require("./common/services");
import("./DB/repository/base.repository.js");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const response_1 = require("./common/response");
const s3WriteStream = (0, node_util_1.promisify)(node_stream_1.pipeline);
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json(), (0, cors_1.default)());
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Welcome to Social Media App" });
    });
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
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.get("/uploads/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const { Body, ContentType } = await services_1.s3Service.getAssets({ Key });
        console.log({ Body, ContentType });
        res.setHeader("Content-Type", ContentType || "application/octet-stream");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`); // only app
        }
        return await s3WriteStream(Body, res);
    });
    app.get("/pre-signed/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await services_1.s3Service.createPresignedFethcLink({ Key, download, fileName });
        return (0, response_1.successResponse)({ res, data: { url } });
    });
    app.get("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "invalid routing" });
    });
    //connecting the database
    await (0, connection_db_1.default)();
    await redis_service_1.default.connect();
    //application-error
    app.use(middleware_1.globalErrorHandler);
    app.listen(config_1.PORT, () => {
        console.log(`Server is running on port ${config_1.PORT}`);
    });
    console.log("Application bootstrapped successfully ");
};
exports.default = bootstrap;
