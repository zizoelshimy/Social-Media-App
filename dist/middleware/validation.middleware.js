"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const domain_exception_1 = require("../common/exceptions/domain.exception");
const validation = (schema) => {
    return (req, res, next) => {
        const issues = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue; // if the schema for this key is not defined, we skip the validation for this key 
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                issues.push({ key, issues: error.issues.map(issue => { return { path: issue.path, message: issue.message }; }) }); //to format the error in a way that we can use it in the error handling middleware to send a proper response to the client with all the validation errors
            }
        }
        if (issues.length) {
            throw new domain_exception_1.BadRequestException("Validation error", { issues });
        }
        next();
    };
};
exports.validation = validation;
