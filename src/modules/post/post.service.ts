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
import { AvailabilityEnum } from "../../common/enums";
import { getAvailability } from "../../common/utils/post";
import { PaginateDto } from "../../common/validation";
import { toObjectId } from "../../common/utils/objectid";
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

  async reactPost(
    {postId}:ReactPostParamsDto,{react}:ReactPostQueryDto,
    user: HydratedDocument<IUser>): Promise<IPost> {
    const post = await this.postRepository.findOneAndUpdate({
      filter:{
        _id:postId,
        $or:getAvailability(user),
      },
      update:{
        ...(Number(react) >0?{$addToSet:{likes:user._id}}:{$pull:{likes:user._id}}), // this is for like or dislike
        //here 0 for dislike and 1 for like 2 for love and so on you can add more reactions by increasing the number and adding a new field in the post model for each reaction and then updating that field here in the same way as likes
      }
    })
    if(!post){
        throw new NotFoundException("Post not found or you don't have access to it")
    }
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
    return updatePost.toJSON();
  }

}
export const postService = new PostService();
