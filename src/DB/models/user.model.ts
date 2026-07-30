import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums";
import { IUser } from "../../common/interfaces";
import { generateEncryption, generateHash } from "../../common/utils/security";

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    slug: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (this) {
        return this.provider == ProviderEnum.SYSTEM;
      },
    },

    phone: { type: String },
    profilePicture: { type: String },
    profileCoverPictures: { type: [String] },

    friends: [{ type: Types.ObjectId, ref: "User" }],

    gender: { type: Number, enum: GenderEnum, default: GenderEnum.MALE },
    role: { type: Number, enum: RoleEnum, default: RoleEnum.USER },
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.SYSTEM,
    },

    changeCredentialsTime: { type: Date },
    DOB: { type: Date },
    confirmEmail: { type: Date },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_MEDIA_APP_USERS",
  },
);
userSchema
  .virtual("username")
  .set(function (value: string) {
    const [firstName, lastName] = (value.split(" ") || []) as string[];
    this.firstName = firstName as string;
    this.lastName = lastName as string;
    this.slug = value.replaceAll(/\s+/g, "-").toLocaleLowerCase();
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

userSchema.pre(["findOne", "find"], async function () {
  const query = this.getQuery() as Record<string, unknown>;
  if (query.paranoid === false) {
    this.setQuery({ ...query });
    return;
  }
  this.setQuery({ ...query, deletedAt: { $exists: false } });
});

userSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
  const update = this.getUpdate() as HydratedDocument<IUser>;
  const query = this.getQuery() as Record<string, unknown>;
  const postModel = this.model.db.model("Post");
  const commentModel = this.model.db.model("Comment");
  const storyModel = this.model.db.model("Story");
  const notificationModel = this.model.db.model("Notification");
  if (update.deletedAt) {
    this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
    await postModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
    );
    await commentModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
    );
    await storyModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
    );
    await notificationModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
    );
  }
  if (update.restoredAt) {
    this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
    await postModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: true } },
      { restoredAt: new Date(), $unset: { deletedAt: 1 } },
    );
    await commentModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: true } },
      { restoredAt: new Date(), $unset: { deletedAt: 1 } },
    );
    await storyModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: true } },
      { restoredAt: new Date(), $unset: { deletedAt: 1 } },
    );
    await notificationModel.updateMany(
      { createdBy: query._id, deletedAt: { $exists: true } },
      { restoredAt: new Date(), $unset: { deletedAt: 1 } },
    );
  }
  if (query.paranoid === false) {
    this.setQuery({ ...query });
    return;
  }
  this.setQuery({ deletedAt: { $exists: false }, ...query });
});

userSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery() as Record<string, unknown>;
  const { force, ...restQuery } = query;
  this.setQuery(restQuery);
  if (force === true) {
    await this.model.db.model("Post").deleteMany({ createdBy: restQuery._id });
    await this.model.db
      .model("Comment")
      .deleteMany({ createdBy: restQuery._id });
    await this.model.db.model("Story").deleteMany({ createdBy: restQuery._id });
    await this.model.db
      .model("Notification")
      .deleteMany({ createdBy: restQuery._id });
  }
});

userSchema.pre(
  "save",
  async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {
    //this to not hash the password again if it is not modified
    if (this.isModified("password")) {
      this.password = await generateHash({ plaintext: this.password });
    }
    if (this.phone && this.isModified("phone")) {
      this.phone = await generateEncryption(this.phone);
    }
  },
);
export const UserModel = models.User || model<IUser>("User", userSchema);
