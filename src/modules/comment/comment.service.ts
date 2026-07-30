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
import { realtimeService } from "../../common/services";
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
    realtimeService.emitToPost(
      post._id.toString(),
      "comment.created",
      comment.toJSON(),
    );
    return comment.toJSON();
  }

  async commentList(
    postId: string,
    user: HydratedDocument<IUser>,
  ): Promise<IComment[]> {
    return await this.commentRepository.find({
      filter: {
        postId,
        $or: getAvailability(user),
      },
      options: { populate: [{ path: "createdBy" }] },
    });
  }

  async getComment(
    postId: string,
    commentId: string,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: {
        _id: commentId,
        postId,
        $or: getAvailability(user),
      },
    });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }
    return comment.toJSON();
  }

  async updateComment(
    postId: string,
    commentId: string,
    body: { content?: string },
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: { _id: commentId, postId, createdBy: user._id },
    });
    if (!comment) {
      throw new NotFoundException(
        "Comment not found or you don't have permission to update it",
      );
    }
    if (body.content) {
      comment.content = body.content;
    }
    comment.updatedBy = user._id;
    await comment.save();
    realtimeService.emitToPost(postId, "comment.updated", comment.toJSON());
    return comment.toJSON();
  }

  async deleteComment(
    postId: string,
    commentId: string,
    user: HydratedDocument<IUser>,
    hard = false,
  ): Promise<boolean> {
    const comment = await this.commentRepository.findOne({
      filter: { _id: commentId, postId, createdBy: user._id },
    });
    if (!comment) {
      throw new NotFoundException(
        "Comment not found or you don't have permission to delete it",
      );
    }
    if (hard) {
      await this.commentRepository.deleteOne({
        filter: { _id: commentId, force: true },
      });
    } else {
      await this.commentRepository.findOneAndUpdate({
        filter: { _id: commentId, postId, createdBy: user._id },
        update: { deletedAt: new Date() },
      });
    }
    realtimeService.emitToPost(postId, "comment.deleted", { commentId, hard });
    return true;
  }

  async restoreComment(
    postId: string,
    commentId: string,
    user: HydratedDocument<IUser>,
  ): Promise<boolean> {
    const result = await this.commentRepository.findOneAndUpdate({
      filter: { _id: commentId, postId, createdBy: user._id },
      update: { restoredAt: new Date() },
    });
    if (!result) {
      throw new NotFoundException(
        "Comment not found or you don't have permission to restore it",
      );
    }
    realtimeService.emitToPost(postId, "comment.restored", { commentId });
    return true;
  }
}
export const commentService = new CommentService();
