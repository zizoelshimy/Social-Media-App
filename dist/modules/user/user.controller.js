"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../../common/response");
const user_service_1 = __importDefault(require("./user.service"));
const middleware_1 = require("../../middleware");
const enums_1 = require("../../common/enums");
const user_authorization_1 = require("./user.authorization");
const router = (0, express_1.Router)();
const userService = new user_service_1.default();
router.get("/", (0, middleware_1.authentication)(enums_1.TokenTypeEnum.ACCESS), (0, middleware_1.authorization)(user_authorization_1.endpoint.profile), async (req, res, next) => {
    const data = await userService.profile(req.user);
    return (0, response_1.successResponse)({
        res,
        data
    });
});
exports.default = router;
