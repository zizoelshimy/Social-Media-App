"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const _1 = require(".");
const index_1 = require("../models/index");
class PostRepository extends _1.DataBaseRepository {
    constructor() {
        super(index_1.PostModel);
    }
}
exports.PostRepository = PostRepository;
