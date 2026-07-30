import { z } from "zod";
import { NotificationAudienceEnum } from "../../common/interfaces";
import { generalValidationFields } from "../../common/validation";

export const createNotification = {
  body: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    audience: z.enum([NotificationAudienceEnum.ALL, NotificationAudienceEnum.USERS]),
    recipients: z.array(generalValidationFields.id).optional(),
    data: z.record(z.string(), z.string()).optional(),
  }),
};

export const notificationParams = {
  params: z.strictObject({
    notificationId: generalValidationFields.id,
  }),
};

export type CreateNotificationDto = z.infer<typeof createNotification.body>;
export type NotificationParamsDto = z.infer<typeof notificationParams.params>;