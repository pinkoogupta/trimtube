import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-v2";

const commentSchema=new Schema(
    {
        content:{
            type:String,
            required:true,

        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    }
)

commentSchema.plugins(mongooseAggregatePaginate)
export const Comment=mongoose.model("Comments",commentSchema);