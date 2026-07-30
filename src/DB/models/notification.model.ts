import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { INotification } from "../../common/interfaces";

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    audience: { type: String, required: true },
    recipients: [{ type: Types.ObjectId, ref: "User" }],
    readBy: [{ type: Types.ObjectId, ref: "User" }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    sentAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_MEDIA_APP_NOTIFICATIONS",
  },
);

notificationSchema.pre(["findOne", "find", "countDocuments"], async function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
    return;
  }
  this.setQuery({ ...query, deletedAt: { $exists: false } });
});

notificationSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
  const update = this.getUpdate() as HydratedDocument<INotification>;
  if (update.deletedAt) {
    this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
  }
  if (update.restoredAt) {
    this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
  }
});

export const NotificationModel = models.Notification || model<INotification>("Notification", notificationSchema);
NotificationModel.syncIndexes();