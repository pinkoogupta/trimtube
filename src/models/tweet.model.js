import mongoose,{Schema} from "mongoose";

const tweetSchema==new Schema({
    content:{
        type:String,
        required:true 
    },
    owner:{
        Type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestapms:true})

export const Tweet=mongoose.model("Tweet",tweetSchema)