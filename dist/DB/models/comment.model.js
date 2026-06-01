"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: { type: [String] },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    postId: { type: mongoose_1.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: mongoose_1.Types.ObjectId, ref: "Comment" },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    deletedAt: { type: Date },
    restoredAt: { type: Date }
}, {
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_MEDIA_APP_POSTS"
});
commentSchema.pre(["findOne", "find", "countDocuments"], async function () {
    console.log(this);
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
        return;
    }
    else {
        this.setQuery({ ...query,
            deletedAt: { $exists: false }
        });
    }
});
commentSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
    const update = this.getUpdate();
    if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
    }
    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deleteAt: 1 } });
    }
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
        return;
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query,
        });
    }
});
commentSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery();
    if (query.force === true) {
        this.setQuery({ ...query });
        return;
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query,
        });
    }
});
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);
exports.CommentModel.syncIndexes();
