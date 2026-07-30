import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IComment } from "../../common/interfaces";

const reactionSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const commentSchema = new Schema<IComment>(
    {
        content: {
            type: String,
            required: function (this) {
                return !this.attachments?.length;
            },
        },
        attachments: { type: [String] },
        likes: [{ type: Types.ObjectId, ref: "User" }],
        reactions: { type: [reactionSchema], default: [] },
        tags: [{ type: Types.ObjectId, ref: "User" }],
        postId: { type: Types.ObjectId, ref: "Post", required: true },
        commentId: { type: Types.ObjectId, ref: "Comment" },
        createdBy: { type: Types.ObjectId, ref: "User", required: true },
        updatedBy: { type: Types.ObjectId, ref: "User" },
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
        collection: "SOCIAL_MEDIA_APP_POSTS",
    },
);

commentSchema.pre(["findOne", "find", "countDocuments"], async function () {
    const query = this.getQuery() as Record<string, unknown>;
    if (query.paranoid === false) {
        this.setQuery({ ...query });
        return;
    }
    this.setQuery({ ...query, deletedAt: { $exists: false } });
});

commentSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
    const update = this.getUpdate() as HydratedDocument<IComment>;
    const query = this.getQuery() as Record<string, unknown>;
    const commentModel = this.model.db.model("Comment");
    if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
        await commentModel.updateMany({ commentId: query._id, deletedAt: { $exists: false } }, { deletedAt: new Date() });
    }
    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
        await commentModel.updateMany({ commentId: query._id, deletedAt: { $exists: true } }, { restoredAt: new Date(), $unset: { deletedAt: 1 } });
    }
    if (query.paranoid === false) {
        this.setQuery({ ...query });
        return;
    }
    this.setQuery({ deletedAt: { $exists: false }, ...query });
});

commentSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery() as Record<string, unknown>;
    const { force, ...restQuery } = query;
    this.setQuery(restQuery);
    if (force === true) {
        await this.model.db.model("Comment").deleteMany({ commentId: restQuery._id });
    }
});

export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema);
CommentModel.syncIndexes();