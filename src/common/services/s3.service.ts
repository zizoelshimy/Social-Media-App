import {
  CompleteMultipartUploadCommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  APPLICATION_NAME,
  AWS_ACCESS_KEY_ID,
  AWS_EXPIRES_IN,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../config/config";
import { randomUUID } from "node:crypto";
import { BadRequestException } from "../exceptions";
import { StorageApproachEnum, UploadApproachEnum } from "../enums";
import { createReadStream } from "node:fs";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export class S3Service {
  private client: S3Client;
  constructor() {
    this.client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  //this is for small file upload
  async uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    contentType,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket: string;
    path: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    contentType?: string | undefined;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
      ACL,
      Body:
        storageApproach === StorageApproachEnum.MEMORY
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype || contentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException("Failed to upload asset");
    }
    await this.client.send(command);
    return command.input.Key;
  }
  //this is for large file upload using multipart upload
  async uploadLargeAsset({
    storageApproach = StorageApproachEnum.DISK,
    Bucket,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    contentType,
    partSize = 5,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket: string;
    path: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    contentType?: string | undefined;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
        ACL,
        Body:
          storageApproach === StorageApproachEnum.MEMORY
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype || contentType,
      },
      partSize: partSize * 1024 * 1024, //5mb
    });
    uploadFile.on("httpUploadProgress", (progress) => {
      console.log(progress);
      console.log(
        `File Upload is ${((progress.loaded as number) / (progress.total as number)) * 100}% done`,
      ); //this is for  tell me the progress of the upload in percentage
    });
    return await uploadFile.done();
  }

  async uploadAssets({
    storageApproach = StorageApproachEnum.MEMORY,
    uploadApproach = UploadApproachEnum.SMALL,
    Bucket,
    path = "general",
    files,
    ACL = ObjectCannedACL.private,
    contentType,
  }: {
    storageApproach?: StorageApproachEnum;
    uploadApproach?: UploadApproachEnum;
    Bucket: string;
    path: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    contentType?: string;
  }): Promise<string[]> {
    let urls: string[] = [];
    if (uploadApproach === UploadApproachEnum.LARGE) {
      const data = await Promise.all(
        files.map((file) => {
          return this.uploadLargeAsset({
            storageApproach,
            file,
            ACL,
            Bucket,
            path,
            contentType,
          });
        }),
      );
      urls = data.map((ele) => ele.Key as string);
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadAsset({
            storageApproach,
            file,
            ACL,
            Bucket,
            path,
            contentType,
          });
        }),
      );
    }

    return urls;
  }

  async createPresignedUploadLink({
    Bucket,
    path = "general",
    expiresIn = AWS_EXPIRES_IN,
    contentType,
    Originalname,
  }: {
    Bucket: string;
    path?: string;
    expiresIn?: number;
    contentType: string;
    Originalname: string;
  }): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${Originalname}`,
      ContentType: contentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException("Failed to upload asset");
    }
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, key: command.input.Key };
  }
}
export const s3Service = new S3Service();
