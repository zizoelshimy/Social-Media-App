"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const services_1 = require("../../common/services");
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const exceptions_1 = require("../../common/exceptions");
const node_crypto_1 = require("node:crypto");
const post_1 = require("../../common/utils/post");
class PostService {
    userRepository;
    redis;
    postRepository;
    s3Service;
    notificationService;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.redis = redis_service_1.default;
        this.s3Service = new services_1.S3Service();
        this.notificationService = new services_1.NotificationService();
    }
    async createPost({ avalibility, content, files, tags }, user) {
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
        const folderId = (0, node_crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3Service.uploadAssets({
                files: files,
                path: `Posts/${folderId}`,
                Bucket: process.env.AWS_BUCKET_NAME,
            });
        }
        const post = await this.postRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
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
                });
            }
            throw new exceptions_1.BadRequestException("Failed to create post");
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
    async postList({ page, size, search }, user) {
        const posts = await this.postRepository.paginate({
            filter: {
                $or: (0, post_1.getAvailability)(user),
                ...(search?.length ? { content: { $regex: search, $options: "i" } } : {})
            },
            page, size,
        });
        return posts;
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
