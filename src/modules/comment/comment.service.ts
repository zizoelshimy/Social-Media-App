import { HydratedDocument, Types } from "mongoose";
import { CreateCommentBodyDto, CreateCommentParamsDto } from "./comment.dto";
import { IComment, IUser } from "../../common/interfaces";
import {
  CommentRepository,
  PostRepository,
  UserRepository,
} from "../../DB/repository";
import {
  NotificationService,
  RedisService,
  S3Service,
} from "../../common/services";
import redisService from "../../common/services/redis.service";
import { getAvailability } from "../../common/utils/post";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions";
export class CommentService {
  private userRepository: UserRepository;
  private readonly redis: RedisService;
  private readonly postRepository: PostRepository;
  private readonly commentRepository: CommentRepository;
  private readonly s3Service: S3Service;
  private readonly notificationService: NotificationService;
  constructor() {
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.commentRepository = new CommentRepository();
    this.redis = redisService;
    this.s3Service = new S3Service();
    this.notificationService = new NotificationService();
  }
  async createComment(
    { postId }: CreateCommentParamsDto,
    { content, files, tags }: CreateCommentBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        $or: getAvailability(user),
      },
    });
    if (!post) {
      throw new NotFoundException("failed to find matching post");
    }
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
    const folderId = post.folderId;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3Service.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Posts/${folderId}`,
        Bucket: process.env.AWS_BUCKET_NAME as string,
      });
    }
    const comment = await this.commentRepository.createOne({
      data: {
        createdBy: user._id,
        content: content as string,
        attachments,
        postId: post._id,
        tags: mentions,
      },
    });
    if (!comment) {
      if (attachments.length) {
        await this.s3Service.deleteAssets({
          Keys: attachments.map((ele) => ({ Key: ele })),
        });
      }
      throw new BadRequestException("Failed to create post");
    }
    if (FCM_Tokens.length) {
      await this.notificationService.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title: "New Comment Created",
          body: JSON.stringify({
            message: `${user.firstName} ${user.lastName} mentioned you in a comment`,
            postId: post._id.toString(),
            commentId: comment._id.toString(),
          }),
        },
      });
    }
    return comment.toJSON();
  }
}
export const commentService = new CommentService();
