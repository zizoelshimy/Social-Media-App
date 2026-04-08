"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const globalErrorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        message: error.message || "internal server error",
        error,
        cause: error.cause,
        stack: error.stack
    });
};
exports.globalErrorHandler = globalErrorHandler;
