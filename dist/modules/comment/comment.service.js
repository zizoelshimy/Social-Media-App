"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = exports.CommentService = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const services_1 = require("../../common/services");
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const post_1 = require("../../common/utils/post");
const exceptions_1 = require("../../common/exceptions");
class CommentService {
    userRepository;
    redis;
    postRepository;
    commentRepository;
    s3Service;
    notificationService;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.commentRepository = new repository_1.CommentRepository();
        this.redis = redis_service_1.default;
        this.s3Service = new services_1.S3Service();
        this.notificationService = new services_1.NotificationService();
    }
    async createComment({ postId }, { content, files, tags }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                $or: (0, post_1.getAvailability)(user),
            },
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("failed to find matching post");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedAccounts.length != tags.length) {
                throw new exceptions_1.NotFoundException("One or more mentioned accounts not found");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => FCM_Tokens.push(token));
            }
        }
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3Service.uploadAssets({
                files: files,
                path: `Posts/${folderId}`,
                Bucket: process.env.AWS_BUCKET_NAME,
            });
        }
        const comment = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
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
            throw new exceptions_1.BadRequestException("Failed to create post");
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
exports.CommentService = CommentService;
exports.commentService = new CommentService();
