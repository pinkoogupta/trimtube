import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // add the value to the object
    user.accessToken = refreshToken;
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    apiError(
      res,
      500,
      false,
      "something wnet wrong while generating refresh and access token"
    );
    return;
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);
  // if (
  //     [fullName, email, username, password].some((field) => field?.trim() === "")
  // ) {
  //     return  apiError(400, "All fields are required");
  // }
  const missingFields = [];

  if (!fullName) missingFields.push("full name");
  if (!email) missingFields.push("email");
  if (!(email.includes("@gmail.com") || email.includes("@outlook.com") || email.includes("@yahoo.com")) ) missingFields.push("use valid extension");
  if (!username) missingFields.push("username");
  if (!password) missingFields.push("password");
  if (!("avatar" in req.files)) missingFields.push("avatar ");
  if (!("coverImage" in req.files)) missingFields.push("coverImage");


  
  if (missingFields.length > 0) {
    const error = `The following fields are required: ${missingFields.join(", ")}`;
    apiError(res, 400, false, error);
    return;
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    apiError(res, 409, false, "User with email or username already exists");
    return;
  }



  

  
  
  
//  const file=[];

//  if (!("avatar" in req.files)) file.push("avatar is required");
//  if (!("coverImage" in req.files)) file.push("coverImage is required");
//  if (file.length > 0) {
//     const fileError= `${file.join(', ')}`;
//     apiError(res, 400, false, fileError);
//     return;
//  }  
// 1.validation correction 
// 2.multer file file upload
// 3.apiError handler to handle all errors respnose
// 4.apiResponse to handle all response 


//   if (!("coverImage" in req.files)) {
//     return apiError(res, 400, false, "Cover image file is required");
//   }
//   if (!("avatar" in req.files)) {
//     return apiError(res, 400, false, "Avatar file is required");
//   }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
  const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    avatar: avatarResponse?.url || "",

    coverImage: coverImageResponse?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id)
  .select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    apiError(
      res,
      500,
      false,
      "Something went wrong while registering the user"
    );
    return;
  }
  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //1.req body->>data
  //2.check input username or email
  //3.find the user
  //4.password check
  //5.generate access and refresh token
  //6.send cookie

  //1.req body->>data

  const { email, username, password } = req.body;
  // console.log(email);

  //2.username or email

  if (!username && !email) {
    apiError(res, 400, false, "username or email is required");
    return;
  }
  // here is an alternative of above code based on logic discussed
  // if(!(username || email)){
  //     apiError(400,"username or email is required");
  // }

  //3.find the user

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    apiError(res, 404, false, "user doesn't exist");
    return;
  }

  //4.password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    apiError(res, 401, false, "password incorrect or invalid user credentials");
    return;
  }

  //5.generate access and refresh token

  //there can be a time taking situation to generate these two.
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  //it's a optional step to get the token generation and call the db
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //6.send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged Out")); // Correct usage of apiResponse
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // access the the old token which is going to expire
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; //after OR is for moblie

  //if token is not incoming
  if (!incomingRefreshToken) {
    apiError(res, 401, false, "unauthorized request");
    return;
  }

  try {
    // verify the token from the old one which is saved to jwt
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    // if token is ficticious or fake, so need to verify from user
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      apiError(res, 400, false, "invalid refresToken");
      return;
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      apiError(res, 401, false, "refresh token is expired or used");
      return;
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken.options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    apiError(res, 401, false, error?.message || "invalid refresh token");
    return;
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  if (!(newPassword === confPassword)) {
    apiError(res, 400, false, "enter the same password");
    return;
  }
  // which user is changing the password
  const user = await User.findById(req.user?._id);

  // compare the old password with the new password
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    apiError(res, 400, false, "invalid old password");
    return;
  }

  // if correct then add the new password in the place of old password
  user.password = newPassword;

  // save the new password
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200), {}, "password changed successfully");
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // console.log(req.user);
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    apiError(res, 400, false, "all fields are required");
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName, // in es6 new method
        email: email, // email:emailold method to set the value
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    apiError(res, 400, false, "avatar file is missing");
    return;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    apiError(res, 400, false, "error while uploading avatar");
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return;
  res
    .status(200)
    .json(new apiResponse(200, user, "avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    apiError(res, 400, false, "coverImage file is missing");
    return;
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    apiError(res, 400, false, "error while uploading avatar");
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return;
  res
    .status(200)
    .json(new apiResponse(200, user, "avatar updated successfully"));
});




const getUserChannelProfile=asyncHandler(async(req,res)=>{   // to show subscriber and subscribed data
      const {username} =req.params
      if(!username?.trim())
      {
        apiError(400,"username is missing")
      }

// User.find({username});  take username from the db and apply aggregation on the basis of id
// instead of that we use the agrregation pipeline
  const channel= await User.aggregate([
    {
      
      $match:{  // filter only doc that matches the specified condition to the next pipeline stage.
        username:username?.toLowerCase() 
      }
    },
    {

      //********/ to get all subscriber*********


      $lookup:{   // to combine the docsthrow channel
         from:"Subscription", //converted in to lowercase and get plural 
         localField:"_id",
         foreignFiled:"channel",
         as:"subscribers"
        }
    },
    {

      //***********to get all subscribed channels throw subscribers*******
      $lookup:{
        from:"subscription",
        localField:"_id",
        foreignFiled:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        
        channelsSubscribedToCount:{
            $size:"$subscribedTo"
          }
          isSubscribed:{
            $cond:{
              if:{$in:[req.user?._id,"$subscribers.subscriber"]},
              then:true,
              else:false
            }
          }
      }
    },
    {
      $project:{   //to project selected things
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])

  

  if(!channel?.length){
    apiError(400,"channel does not exist")
  }
  return  res
  .status(200)
  .json(
    new apiResponse(200,channel[0],"user channel fetched
     successfully")
  )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
// req.user._id //it return the string which handled by mongoose 

const user=await User.aggregate([
  {
    $match:{
      _id:new mongoose.Types.ObjectId(req.user._id) //convert to object id
    } 
  },
  {
    $lookup:{

      from:"videos",
      localField:"watchHistory",
      foreignFiled:"_id", //from videos schema
      as:"watchHistory",

//  %%%%%%%%%%%%%%%%% nested pipeline, now we are under the videos
      pipeline:[  
      {
        $lookup:{
          from:"users",
          localField:"owner",
          foreignFiled:"_id",
          as:"owner",

          pipeline:[
            {
              $project:{
                fullName:1,   //we can write it outside but the structure will changed something
                username:1,
                avatar:1
              }
            }
          ]
        }
      },

// ******add just not to return an array , just return the first elements.
      {
        $addField:{        
          owner:{
            $first:"$owner"
          }
        }
      }
    ]
    }
  }
])
return res
.status(200)
.json(
  new apiResponse(
    user[0].watchHistory,
    "watch history fetched successfully"
  )
)
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};