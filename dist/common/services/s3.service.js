"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../../config/config");
const node_crypto_1 = require("node:crypto");
const exceptions_1 = require("../exceptions");
const enums_1 = require("../enums");
const node_fs_1 = require("node:fs");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_1.AWS_REGION,
            credentials: {
                accessKeyId: config_1.AWS_ACCESS_KEY_ID,
                secretAccessKey: config_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    //this is for small file upload
    async uploadAsset({ storageApproach = enums_1.StorageApproachEnum.MEMORY, Bucket, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, contentType, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            ACL,
            Body: storageApproach === enums_1.StorageApproachEnum.MEMORY
                ? file.buffer
                : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype || contentType,
        });
        if (!command.input?.Key) {
            throw new exceptions_1.BadRequestException("Failed to upload asset");
        }
        await this.client.send(command);
        return command.input.Key;
    }
    //this is for large file upload using multipart upload
    async uploadLargeAsset({ storageApproach = enums_1.StorageApproachEnum.DISK, Bucket, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, contentType, partSize = 5, }) {
        const uploadFile = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                ACL,
                Body: storageApproach === enums_1.StorageApproachEnum.MEMORY
                    ? file.buffer
                    : (0, node_fs_1.createReadStream)(file.path),
                ContentType: file.mimetype || contentType,
            },
            partSize: partSize * 1024 * 1024, //5mb
        });
        uploadFile.on("httpUploadProgress", (progress) => {
            console.log(progress);
            console.log(`File Upload is ${(progress.loaded / progress.total) * 100}% done`); //this is for  tell me the progress of the upload in percentage
        });
        return await uploadFile.done();
    }
    async uploadAssets({ storageApproach = enums_1.StorageApproachEnum.MEMORY, uploadApproach = enums_1.UploadApproachEnum.SMALL, Bucket, path = "general", files, ACL = client_s3_1.ObjectCannedACL.private, contentType, }) {
        let urls = [];
        if (uploadApproach === enums_1.UploadApproachEnum.LARGE) {
            const data = await Promise.all(files.map((file) => {
                return this.uploadLargeAsset({
                    storageApproach,
                    file,
                    ACL,
                    Bucket,
                    path,
                    contentType,
                });
            }));
            urls = data.map((ele) => ele.Key);
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadAsset({
                    storageApproach,
                    file,
                    ACL,
                    Bucket,
                    path,
                    contentType,
                });
            }));
        }
        return urls;
    }
    async createPresignedUploadLink({ Bucket, path = "general", expiresIn = config_1.AWS_EXPIRES_IN, contentType, Originalname, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${Originalname}`,
            ContentType: contentType,
        });
        if (!command.input?.Key) {
            throw new exceptions_1.BadRequestException("Failed to upload asset");
        }
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, key: command.input.Key };
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
