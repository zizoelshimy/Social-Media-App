import { HydratedDocument, Types } from "mongoose";
import { NotificationRepository } from "../../DB/repository/notification.repository";
import { INotification, NotificationAudienceEnum, IUser } from "../../common/interfaces";
import { BadRequestException, NotFoundException, ForbiddenException } from "../../common/exceptions";
import { NotificationService, realtimeService, RedisService } from "../../common/services";
import redisService from "../../common/services/redis.service";
import { CreateNotificationDto } from "./notification.dto";

export class AdminNotificationService {
  private readonly notificationRepository: NotificationRepository;
  private readonly pushService: NotificationService;
  private readonly redis: RedisService;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.pushService = new NotificationService();
    this.redis = redisService;
  }

  async createNotification(data: CreateNotificationDto, user: HydratedDocument<IUser>): Promise<INotification> {
    if (!user || user.role !== 1) {
      throw new ForbiddenException("Only admin can create notifications");
    }
    const recipients = data.recipients?.map((recipient) => Types.ObjectId.createFromHexString(recipient)) || [];
    const notification = await this.notificationRepository.createOne({
      data: {
        title: data.title,
        body: data.body,
        audience: data.audience,
        recipients,
        data: data.data,
        createdBy: user._id,
        sentAt: new Date(),
      },
    });
    if (!notification) {
      throw new BadRequestException("Failed to create notification");
    }
    if (data.audience === NotificationAudienceEnum.ALL) {
      realtimeService.emit("notification.created", notification.toJSON());
    }
    if (recipients.length) {
      const fcmTokens: string[] = [];
      for (const recipient of recipients) {
        ((await this.redis.getFCMs(recipient)) || []).forEach((token) => fcmTokens.push(token));
      }
      if (fcmTokens.length) {
        await this.pushService.sendNotifications({
          tokens: fcmTokens,
          data: { title: data.title, body: data.body },
        });
      }
    }
    return notification.toJSON();
  }

  async listNotifications(user: HydratedDocument<IUser>): Promise<INotification[]> {
    if (user.role === 1) {
      return await this.notificationRepository.find({ options: { populate: [{ path: "recipients" }] } });
    }
    return await this.notificationRepository.find({
      filter: {
        $or: [
          { audience: NotificationAudienceEnum.ALL },
          { recipients: { $in: [user._id] } },
        ],
      },
    });
  }

  async getNotification(notificationId: string, user: HydratedDocument<IUser>): Promise<INotification> {
    const notification = await this.notificationRepository.findOne({ filter: { _id: notificationId } });
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    if (user.role !== 1 && notification.audience !== NotificationAudienceEnum.ALL) {
      const recipients = notification.recipients as Types.ObjectId[] | undefined;
      const isRecipient = recipients?.some((recipient) => recipient.toString() === user._id.toString());
      if (!isRecipient) {
        throw new ForbiddenException("Notification not accessible");
      }
    }
    return notification.toJSON();
  }

  async deleteNotification(notificationId: string, user: HydratedDocument<IUser>): Promise<boolean> {
    if (user.role !== 1) {
      throw new ForbiddenException("Only admin can delete notifications");
    }
    const result = await this.notificationRepository.findOneAndUpdate({
      filter: { _id: notificationId },
      update: { deletedAt: new Date() },
    });
    if (!result) {
      throw new NotFoundException("Notification not found");
    }
    return true;
  }

  async markAsRead(notificationId: string, user: HydratedDocument<IUser>): Promise<boolean> {
    const result = await this.notificationRepository.findOneAndUpdate({
      filter: { _id: notificationId },
      update: { $addToSet: { readBy: user._id } },
    });
    if (!result) {
      throw new NotFoundException("Notification not found");
    }
    return true;
  }
}

export const notificationService = new AdminNotificationService();