"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const _1 = require(".");
const user_model_1 = require("../models/user.model");
class UserRepository extends _1.DataBaseRepository {
    constructor() {
        super(user_model_1.UserModel);
    }
}
exports.UserRepository = UserRepository;
