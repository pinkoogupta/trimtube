import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken" 
import bcrypt from "bcrypt"

const UserSchema=new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true //by adding this the database enable the searching filed
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
         
        },
        fullName:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,//cloudnary url cause it's free
            required:true,
        },
        coverImage:{
            type:String,//cloudinary url
        }
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"];
        },
        refreshToken:{
            type:String
        },
        
},
{
    timestamps:true
}
)

userSchema.pre("save", async function(next){ 

    //if we don't apply the if condition then it changes the hash code whenerver the user changes in any field it change the hash code of the password
    if(!this.isModified("password"))  return next();//the password needs to pass in the string 
  
  else   this.password=bcrypt.hash(this.password,10)
    next();
})
userSchema.methods.isPasswordCorrect=async function(password)
{
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
  return  jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken=function(){
    return  jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const user=mongoose.model("User",UserSchema);