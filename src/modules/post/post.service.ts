import { HydratedDocument, Types } from "mongoose";
import { CreatePostBodyDto } from "./post.dto";
import { IPost, IUser } from "../../common/interfaces";
import { PostRepository, UserRepository } from "../../DB/repository";
import {
  NotificationService,
  RedisService,
  S3Service,
} from "../../common/services";
import redisService from "../../common/services/redis.service";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions";
import { randomUUID } from "node:crypto";
export class PostService {
  private userRepository: UserRepository;
  private readonly redis: RedisService;
  private readonly postRepository: PostRepository;
  private readonly s3Service: S3Service;
  private readonly notificationService: NotificationService;
  constructor() {
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.redis = redisService;
    this.s3Service = new S3Service();
    this.notificationService = new NotificationService();
  }
  async createPost(
    { avalibility, content, files, tags }: CreatePostBodyDto,
    user: HydratedDocument<IUser>): Promise<IPost> {
    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedAccounts = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedAccounts.length != tags.length) {
        throw new NotFoundException("One or more mentioned accounts not found");
      }
      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
        );
      }
    }
    const folderId = randomUUID();
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3Service.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Posts/${folderId}`,
        Bucket: process.env.AWS_BUCKET_NAME as string,
      });
    }
    const post = await this.postRepository.createOne({
      data: {
        createdBy: user._id,
        content: content as string,
        attachments,
        folderId,
        availability: avalibility,
        tags: mentions,
      },
    });
    if (!post) {
        if (attachments.length) {
            await this.s3Service.deleteAssets({
                Keys: attachments.map((ele) => ({ Key: ele })),
            })
        }
      throw new BadRequestException("Failed to create post");
    }
    if (FCM_Tokens.length) {
      await this.notificationService.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title: "New Post Created",
          body: JSON.stringify({
            message: `${user.firstName} ${user.lastName} mentioned you in a post`,
            postId: post._id.toString(),
          }),
        },
      });
    }
    return post.toJSON();
  }
}
export const postService = new PostService();
