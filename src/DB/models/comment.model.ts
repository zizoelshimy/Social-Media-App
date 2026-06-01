import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { AvailabilityEnum } from "../../common/enums";
import { IComment, IPost } from "../../common/interfaces";

const commentSchema = new Schema<IComment>({
    content: { 
        type: String,
        required: function (this) {
            return !this.attachments?.length
        }
    },
    attachments: { type: [String] },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],

    postId:{type:Types.ObjectId,ref:"Post",required:true},
    commentId:{type:Types.ObjectId,ref:"Comment"},

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    deletedAt: { type: Date },
    restoredAt: { type: Date }
},{
    timestamps:true,
    toObject:{
        virtuals:true
    },
    toJSON:{
        virtuals:true
    },
    strict:true,
    strictQuery:true,
    collection:"SOCIAL_MEDIA_APP_POSTS"
})

commentSchema.pre(["findOne", "find","countDocuments"], async function () {
console.log(this)
const query=this.getQuery()
if(query.paranoid === false){
    this.setQuery({...query})
    return
}
else{
this.setQuery({...query,
deletedAt:{$exists:false}
})
}

} )
 
commentSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
    const update=this.getUpdate() as HydratedDocument<IComment>
    if(update.deletedAt){
        this.setUpdate({...update,$unset:{restoredAt:1}}) 
    }
    if(update.restoredAt){
            this.setUpdate({...update,$unset:{deleteAt:1}}) 
    }
const query=this.getQuery()
if(query.paranoid === false){
    this.setQuery({...query})
    return
}
else{
this.setQuery({deletedAt:{$exists:false},...query,

})
}

} )
commentSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
 
  
const query=this.getQuery()
if(query.force === true){
    this.setQuery({...query})
    return
}
else{
this.setQuery({deletedAt:{$exists:true},...query,

})
}

} )


export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema)
CommentModel.syncIndexes()