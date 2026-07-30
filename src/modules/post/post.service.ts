import { HydratedDocument, Types } from "mongoose";
import { CreatePostBodyDto, ReactPostParamsDto, ReactPostQueryDto, UpdatePostBodyDto, UpdatePostParamsDto } from "./post.dto";
import { IPaginate, IPost, IUser } from "../../common/interfaces";
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
import { getAvailability } from "../../common/utils/post";
import { PaginateDto } from "../../common/validation";
import { toObjectId } from "../../common/utils/objectid";
import { realtimeService } from "../../common/services";
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
    realtimeService.emit("post.created", post.toJSON());
    return post.toJSON();
  }

  async reactPost(
    {postId}:ReactPostParamsDto,{react, emoji}:ReactPostQueryDto,
    user: HydratedDocument<IUser>): Promise<IPost> {
    const post = await this.postRepository.findOne({
      filter:{
        _id:postId,
        $or:getAvailability(user),
      },
    })
    if(!post){
        throw new NotFoundException("Post not found or you don't have access to it")
    }
    const reactionEmoji = emoji || (Number(react) > 0 ? "like" : undefined);
    post.reactions = ((post.reactions || []) as NonNullable<IPost["reactions"]>).filter((reaction) => reaction.user.toString() !== user._id.toString());
    const likes = ((post.likes || []) as Types.ObjectId[]).filter((liker) => liker.toString() !== user._id.toString());
    if (reactionEmoji) {
      post.reactions.push({ user: user._id, emoji: reactionEmoji, createdAt: new Date(), updatedAt: new Date() } as never);
      if (reactionEmoji === "like") {
        likes.push(user._id);
      }
    }
    post.likes = likes as never;
    await post.save();
    realtimeService.emitToPost(post._id.toString(), "post.reacted", post.toJSON());
    return post.toJSON();
  }


  async postList({page,size,search}:PaginateDto,
    user: HydratedDocument<IUser>): Promise<IPaginate<IPost>> {
    const posts = await this.postRepository.paginate({
        filter: {
            $or:getAvailability(user),
            ...(search?.length?{content:{$regex:search,$options:"i"}}:{})
        },
        page,size,
        options:{
          populate:[{path:"comments"}]
        }
    })
    return posts
  }

  async getPost(postId: string, user: HydratedDocument<IUser>): Promise<IPost> {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        $or: getAvailability(user),
      },
      options: { populate: [{ path: "comments" }, { path: "createdBy" }], lean: false } as any,
    });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    return post.toJSON();
  }

  async deletePost(postId: string, user: HydratedDocument<IUser>, hard = false): Promise<boolean> {
    const filter = hard
      ? { _id: postId, createdBy: user._id, force: true }
      : { _id: postId, createdBy: user._id };
    const result = hard
      ? await this.postRepository.deleteOne({ filter })
      : await this.postRepository.findOneAndUpdate({
          filter,
          update: { deletedAt: new Date() },
        });
    if (!result) {
      throw new NotFoundException("Post not found or you don't have permission to delete it");
    }
    return true;
  }

  async restorePost(postId: string, user: HydratedDocument<IUser>): Promise<boolean> {
    const result = await this.postRepository.findOneAndUpdate({
      filter: { _id: postId, createdBy: user._id },
      update: { restoredAt: new Date() },
    });
    if (!result) {
      throw new NotFoundException("Post not found or you don't have permission to restore it");
    }
    return true;
  }

  async dashboardFeed(query: PaginateDto, user: HydratedDocument<IUser>): Promise<IPaginate<IPost>> {
    return await this.postList(query, user);
  }

  async profilePosts(profileUserId: string, query: PaginateDto, user: HydratedDocument<IUser>): Promise<IPaginate<IPost>> {
    const posts = await this.postRepository.paginate({
      filter: {
        createdBy: profileUserId,
        ...(profileUserId === user._id.toString() ? {} : { availability: { $in: [0, 1] } }),
      },
      page: query.page,
      size: query.size,
      options: { populate: [{ path: "comments" }] },
    });
    return posts;
  }

   async updatePost({postId}:UpdatePostParamsDto,
    { avalibility, content, files, tags=[],removeFiles=[],removeTags=[] }: UpdatePostBodyDto,
    user: HydratedDocument<IUser>): Promise<IPost> {
      const post = await this.postRepository.findOne({
        filter:{
            _id:postId,
            createdBy:user._id
        }
      })
       if(!post){
           throw new NotFoundException("Post not found or you don't have permission to update it")
        }
        //this for check that the post is not empty after update because we have a condition in the post model that the post must have content or attachments and if we remove all attachments and not add new content or attachments it will be an invalid post
        if(!post.content && !files?.length && post.attachments?.length == removeFiles?.length){
            throw new BadRequestException("we can't update post to have no content and no attachments")
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
    const updatePost = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: postId,
        createdBy: user._id
      },
      update: [
        {
          $set:{
        content: content || post.content,
        availability: Number(avalibility|| post.availability) ,
        updatedBy: user._id,
        attachments:{
          //this for add new attachments and remove the removed attachments from the post
          $setUnion:[
            {
              $setDifference:[
                "$attachments",
                removeFiles
              ]
            },
            attachments
          ]
        },
        tags:{
          //this for add new tags and remove the removed tags from the post
          $setUnion:[
            {
              $setDifference:[
                "$tags",
                removeTags.map((ele)=>{return toObjectId(ele)})
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
            })
        }
      throw new BadRequestException("Failed to update post");
    }
    if (removeFiles?.length) {
       await this.s3Service.deleteAssets({
                Keys: removeFiles.map((ele) => ({ Key: ele })),
            })
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
    realtimeService.emitToPost(updatePost._id.toString(), "post.updated", updatePost.toJSON());
    return updatePost.toJSON();
  }

}
export const postService = new PostService();
