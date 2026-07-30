import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IStory } from "../../common/interfaces";

const storySchema = new Schema<IStory>(
  {
    folderId: { type: String, required: true },
    content: { type: String },
    attachments: { type: [String] },
    viewers: [{ type: Types.ObjectId, ref: "User" }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
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
    collection: "SOCIAL_MEDIA_APP_STORIES",
  },
);

storySchema.pre(["findOne", "find", "countDocuments"], async function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
    return;
  }
  this.setQuery({ ...query, deletedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
});

storySchema.pre(["updateOne", "findOneAndUpdate"], async function () {
  const update = this.getUpdate() as HydratedDocument<IStory>;
  if (update.deletedAt) {
    this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
  }
  if (update.restoredAt) {
    this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
  }
});

export const StoryModel = models.Story || model<IStory>("Story", storySchema);
StoryModel.syncIndexes();