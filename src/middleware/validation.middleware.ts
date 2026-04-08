import type { NextFunction, Request, Response } from "express"
import { BadRequestException } from "../common/exceptions/domain.exception"
import { ZodError, ZodType } from "zod"
type KeyReqType = keyof Request
type SchemaType = Partial<Record<KeyReqType, ZodType>> //we make it partial because we may not want to validate all the request properties and we make the value type ZodType because we want to use the zod schema to validate the request data
type IssuesType = Array<{
    key: KeyReqType,
    issues: Array<{
        message: string,
        path: Array<string | number | symbol | undefined>
    }>
}>   
export const validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
       
        const issues: IssuesType = []
        for (const key of Object.keys(schema) as KeyReqType[]) {
            if (!schema[key]) continue; // if the schema for this key is not defined, we skip the validation for this key 
            const validationResult = schema[key].safeParse(req[key])
            if (!validationResult.success) {
                const error = validationResult.error as ZodError
                issues.push({ key, issues: error.issues.map(issue => { return { path: issue.path, message: issue.message } }) }) //to format the error in a way that we can use it in the error handling middleware to send a proper response to the client with all the validation errors
            }
        }

        if (issues.length) {
            throw new BadRequestException("Validation error", { issues })
        }
        next()
    }
}