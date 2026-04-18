"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserService {
    constructor() { }
    async profile(user) {
        return user.toJSON();
    }
}
exports.default = UserService;
