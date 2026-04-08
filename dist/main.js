"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_bootstrap_1 = __importDefault(require("./app.bootstrap"));
const node_path_1 = __importDefault(require("node:path"));
console.log(node_path_1.default.join());
(0, app_bootstrap_1.default)();
