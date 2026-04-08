"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationException = void 0;
class ApplicationException extends Error {
    statusCode;
    constructor(message, statusCode, cause) {
        super(message, { cause }); // Pass the message and cause to the base Error class
        this.statusCode = statusCode;
        this.name = this.constructor.name; // Set the name property to the name of the derived class when we make a forbiden exception it will be named forbidden exception not the error class 
        Error.captureStackTrace(this, this.constructor); // Capture the stack trace for better debugging 
    }
}
exports.ApplicationException = ApplicationException;
