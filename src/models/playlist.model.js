import mongoose ,{Schema} from "mongoose";

const playlistSchema=Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    videos:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }



    

},timestapms:true)

export Playlist=mongoose.model("Playlist",playlistSchema);