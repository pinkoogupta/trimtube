import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-v2";

const videSchema=new Schema(
    {
        videFile:{
            type:String, //cloudinary
            required:true,
        },
        thumbnail:{
            type:String, //cloudinary
            unique:true
        },
        title:{
            type:String,
            required:true,
            lowercase:true,
            trim:true
        },
        description:{
            type:String,
            required:true,
            lowercase:true
        },
        duration:{
            type:Number, //cloudinary
            required:true,
        },
        views:{
            type:Number,
            default:0
            required:true,
        },
        isPublished:{
            type:Boolean,
            default:true,
            required:true
        },
        owner:{
            type:Schema.Type.ObjectId,
            ref:"User"
        }
    },
    timestamps:true
)

videoSchema.plugins(mongooseAggregatePaginate)
export const Video=mongoose.model("Video",videoSchema)