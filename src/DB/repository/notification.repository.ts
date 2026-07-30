import { DataBaseRepository } from ".";
import { INotification } from "../../common/interfaces";
import { NotificationModel } from "../models/notification.model";

export class NotificationRepository extends DataBaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }
}
