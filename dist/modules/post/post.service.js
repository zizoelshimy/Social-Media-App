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
const objectid_1 = require("../../common/utils/objectid");
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
    async reactPost({ postId }, { react }, user) {
        const post = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, post_1.getAvailability)(user),
            },
            update: {
                ...(Number(react) > 0 ? { $addToSet: { likes: user._id } } : { $pull: { likes: user._id } }), // this is for like or dislike
                //here 0 for dislike and 1 for like 2 for love and so on you can add more reactions by increasing the number and adding a new field in the post model for each reaction and then updating that field here in the same way as likes
            }
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("Post not found or you don't have access to it");
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
            options: {
                populate: [{ path: "comments" }]
            }
        });
        return posts;
    }
    async updatePost({ postId }, { avalibility, content, files, tags = [], removeFiles = [], removeTags = [] }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                createdBy: user._id
            }
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("Post not found or you don't have permission to update it");
        }
        //this for check that the post is not empty after update because we have a condition in the post model that the post must have content or attachments and if we remove all attachments and not add new content or attachments it will be an invalid post
        if (!post.content && !files?.length && post.attachments?.length == removeFiles?.length) {
            throw new exceptions_1.BadRequestException("we can't update post to have no content and no attachments");
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
        const updatePost = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                createdBy: user._id
            },
            update: [
                {
                    $set: {
                        content: content || post.content,
                        availability: Number(avalibility || post.availability),
                        updatedBy: user._id,
                        attachments: {
                            //this for add new attachments and remove the removed attachments from the post
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$attachments",
                                        removeFiles
                                    ]
                                },
                                attachments
                            ]
                        },
                        tags: {
                            //this for add new tags and remove the removed tags from the post
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$tags",
                                        removeTags.map((ele) => { return (0, objectid_1.toObjectId)(ele); })
                                    ]
                                },
                                mentions
                            ]
                        }
                    }
                }
            ],
        });
        if (!updatePost) {
            if (attachments.length) {
                await this.s3Service.deleteAssets({
                    Keys: attachments.map((ele) => ({ Key: ele })),
                });
            }
            throw new exceptions_1.BadRequestException("Failed to update post");
        }
        if (removeFiles?.length) {
            await this.s3Service.deleteAssets({
                Keys: removeFiles.map((ele) => ({ Key: ele })),
            });
        }
        if (FCM_Tokens.length) {
            await this.notificationService.sendNotifications({
                tokens: FCM_Tokens,
                data: {
                    title: "New Post Created",
                    body: JSON.stringify({
                        message: `${user.firstName} ${user.lastName} mentioned you in a post`,
                        postId: updatePost._id.toString(),
                    }),
                },
            });
        }
        return updatePost.toJSON();
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
