import mongoose ,{Schema} from "mongoose";


const likeSchema=new Schema({
    video:{
        type:Schema.Type.ObjectId,
        ref:"Video"
    },
    comment:{
        type:Schema.Type.ObjectId,
        ref:"Comment"
    },
    tweet:{
        type:Schema.Type.ObjectId,
        ref:"Tweet"
    },
    likedBy:{
        type:Schema.Type.ObjectId,
        ref:"User"
    },

},{timestapms:true})

export const Like=mongoose.model("Like",likeSchema);