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
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Welcome to Social Media App" });
    });
    //applying routing
    app.use("/auth", modules_1.authRouter);
    app.get("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "invalid routing" });
    });
    //connecting the database
    await (0, connection_db_1.default)();
    //application-error
    app.use(middleware_1.globalErrorHandler);
    app.listen(config_1.PORT, () => {
        console.log(`Server is running on port ${config_1.PORT}`);
    });
    console.log("Application bootstrapped successfully ");
};
exports.default = bootstrap;
