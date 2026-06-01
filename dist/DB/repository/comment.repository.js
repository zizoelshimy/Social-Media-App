"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const _1 = require(".");
const index_1 = require("../models/index");
class CommentRepository extends _1.DataBaseRepository {
    constructor() {
        super(index_1.CommentModel);
    }
}
exports.CommentRepository = CommentRepository;
