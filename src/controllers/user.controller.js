import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiResponse.js";



const registerUser=asyncHandler(async(req,res)=>{

 //-------    steps to take the data from the user----
    // 1.get user details from frontend
    // 2.validation- not empty
    // 3.check if user is not exisiting:username,email
    // 4.check for images and check for avatar
    // 5.upload them to cloundinary, avatar
    // 6.crate-user-object-create entry in db
    // 7.remove password and refresh token field from response 
    // 8.check for user creation is null or created
    // 9.return the response 



// demo code to check the error

//    return  res.status(200).json({
//         message:"ok"
//     })

 // 1.get user details from frontend

const {fullName,email,username,password}=req.body 
console.log("email",email);


// simple method to check validation
// if(fullName===""){
//     throw new apiError(400,"fullname is required");
// }


//2. to add all the checklist in an array to check the fields that they are not empty
if(
    [fullName,email,username,password].some((field)=>{
      return field? trim()==="" 
    })
){
throw new apiError(400,"all fields are required");
}
// for validating email
const index=email.indexOf("@")
if(index!==-1){
    return true;
}
else{
    throw new apiError(400,"@ is required");
}

//3. is user existing or not

const existedUser=User.findOne(
    {
        // username|| email
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new apiError(409,"user with email or username is already existing")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

//4. check the avatar is registered or not
    if(!avatarLocalPath){
        throw new apiError(400,"avatar file is required");
    }
// 5.upload them to cloundinary, avatar
  const avatar= await uploadOnCloudinary(avatarLocalPath);
  const coverImage=await uploadOnCloudinary(coverImageLocalPath);
  if(!avatar){
    throw new apiError(400,"avatar file is required")
  }

// 6.crate-user-object-create entry in db

const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "" //check the coverimage and if it is not existing then make this empty
    email,
    password,
    username:username.toLowerCase();
  })
 
 // 7.remove password and refresh token field from response 

  const createsUser=await User.findById(user._id).select(
    "-password -refreshToken"
)
if(createsUser){
    throw new apiError(500,"something went wrong while registering the user ");
}

return res.status(201).json(
    new apiResponse(200,createsUser,"User registered successfully");
)

})
export {registerUser};
