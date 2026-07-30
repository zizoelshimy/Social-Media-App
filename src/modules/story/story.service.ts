import { randomUUID } from "node:crypto";
import { HydratedDocument } from "mongoose";
import { StoryRepository } from "../../DB/repository/story.repository";
import { IStory, IUser } from "../../common/interfaces";
import { BadRequestException, NotFoundException } from "../../common/exceptions";
import { realtimeService, S3Service } from "../../common/services";
import { CreateStoryDto } from "./story.dto";

export class StoryService {
  private readonly storyRepository: StoryRepository;
  private readonly s3Service: S3Service;

  constructor() {
    this.storyRepository = new StoryRepository();
    this.s3Service = new S3Service();
  }

  async createStory(data: CreateStoryDto, user: HydratedDocument<IUser>): Promise<IStory> {
    const folderId = randomUUID();
    const story = await this.storyRepository.createOne({
      data: {
        createdBy: user._id,
        folderId,
        content: data.content,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    if (!story) {
      throw new BadRequestException("Failed to create story");
    }
    realtimeService.emitToUser(user._id.toString(), "story.created", story.toJSON());
    return story.toJSON();
  }

  async storyList(user: HydratedDocument<IUser>) {
    return await this.storyRepository.find({
      filter: {
        $or: [{ createdBy: user._id }, { createdBy: { $in: user.friends || [] } }],
      },
      options: { populate: [{ path: "createdBy" }] },
    });
  }

  async deleteStory(storyId: string, user: HydratedDocument<IUser>): Promise<boolean> {
    const story = await this.storyRepository.findOne({
      filter: { _id: storyId, createdBy: user._id },
    });
    if (!story) {
      throw new NotFoundException("Story not found");
    }
    await this.storyRepository.findOneAndUpdate({
      filter: { _id: storyId },
      update: { deletedAt: new Date() },
    });
    if (story.attachments?.length) {
      await this.s3Service.deleteAssets({ Keys: story.attachments.map((key) => ({ Key: key })) });
    }
    return true;
  }
}

export const storyService = new StoryService();