import {ObjectCannedACL, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import { APPLICATION_NAME, AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../../config/config";
import { randomUUID } from "node:crypto";
import { BadRequestException } from "../exceptions";
import { StorageApproachEnum } from "../enums";
import { createReadStream } from "node:fs";
export class S3Service {


    private client:S3Client
    constructor() {
        this.client = new S3Client({
            region:AWS_REGION,
                credentials: {
                    accessKeyId:AWS_ACCESS_KEY_ID,
                    secretAccessKey:AWS_SECRET_ACCESS_KEY
                }
        })
    }
    async uploadAsset({
        storageApproach=StorageApproachEnum.MEMORY,
        Bucket,
        path="general",
        file,
        ACL=ObjectCannedACL.private,
        contentType
    }:{
        storageApproach?:StorageApproachEnum,
        Bucket:string,
        path:string,
        file:Express.Multer.File
        ACL?:ObjectCannedACL,
        contentType?:string
    }) {
        const command = new PutObjectCommand({
            Bucket,
            Key:`${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
            ACL,
            Body:storageApproach === StorageApproachEnum.MEMORY ? file.buffer :createReadStream(file.path),
            ContentType:file.mimetype || contentType
        })
        if(!command.input?.Key){
            throw new BadRequestException("Failed to upload asset");
        }
        await this.client.send(command);
        return command.input.Key;

    }
}
export const s3Service = new S3Service()