import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()


      // add the value to the object
      user.accessToken=refreshToken
        user.refreshToken=refreshToken


        await user.save({validateBeforeSave:false })

        return {accessToken,refreshToken};

    }
    catch(error){
        throw new apiError(500,"something wnet wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new apiError(409, "User with email or username already exists")
    }
    //console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
   
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }
    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }
   
   const user = await User.create({
    
    fullName,
    avatar: avatarResponse?.url || "",

    coverImage: coverImageResponse?.url || "",
    email, 
    password,
    username: username.toLowerCase()
});
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered Successfully")
    )

} )



const loginUser=asyncHandler(async(req,res,)=>{
//1.req body->>data
//2.check input username or email
//3.find the user
//4.password check
//5.generate access and refresh token
//6.send cookie


//1.req body->>data

const {email,username,password}=req.body;
console.log(email);

//2.username or email

if(!username && !email){
    throw new apiError(400,"username or email is required");
}
// here is an alternative of above code based on logic discussed
// if(!(username || email)){
//     throw new apiError(400,"username or email is required");
// }


//3.find the user

const  user=await User.findOne({
     $or :[{username},{email}]
})
if(!user){
    throw new apiError(404,"user doesn't exist");
}


//4.password check
const isPasswordValid=await user.isPasswordCorrect(password)

if(!isPasswordValid){
    throw new apiError(401,"password incorrect or invalid user credentials");
}



//5.generate access and refresh token

//there can be a time taking situation to generate these two. 
const {accessToken,refreshToken} =await generateAccessAndRefreshToken(user._id)

//it's a optional step to get the token generation and call the db 
const loggedInUser=await User.findById(user._id)
.select("-password -refreshToken")

//6.send cookies
const options={
    httpOnly:true,
    secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new apiResponse(
        200,{
            user:loggedInUser,accessToken,
            refreshToken
        },"user logged in successfully"
    )
)

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged Out")); // Correct usage of apiResponse
});


const refreshAccessToken=asyncHandler(async(req,res)=>{
    // access the the old token which is going to expire
    const =incomingRefreshToken=req.cookies
    .refreshToken || req.body.refreshToken //after OR is for moblie 

    //if token is not incoming 
    if(!incomingRefreshToken){
        throw new apiError(401,"unauthorized request");
    }

    try {
        // verify the token from the old one which is saved to jwt
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // if token is ficticious or fake, so need to verify from user
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new apiError(400,"invalid refresToken");
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new apiError(401,"refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newrefreshToken}await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken.options)
        .json(
            new apiResponse (
                200,
                {accessToken,refreshToken:newrefreshToken},
                "access token refreshed"
            )
        )
    
    } catch (error) {
        throw new apiError(401,error?.message||
            "invalid refresh token")
    }

    

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};
