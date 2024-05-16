 import {asyncHandler} from "../utils/asyncHandler.js";
 import jwt from "jsonwebtoken";
 import {User} from "../models/user.model.js";
 import {apiError} from "../utils/apiError.js";

  
 export const verifyJWT=asyncHandler(async(req,res,next)=>{
   try {
     //for the access of  all the cookies
    const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  //  console.log(token);
    if(!token){
     throw new apiError(401,"unauthorized request")
    }
  const decodedToken= jwt
    .verify(token,process.env.ACCESS_TOKEN_SECRET)
 
 
 const user=await User.findById(decodedToken?._id)
 .select("-password -refreshToken")
 
 
 if(!user){
     //todo: discuss about frontend
     throw new apiError(401,"invalid access token");
 }
//  set the object user 
 req.user=user;
 next();
 
   } catch (error) {
    throw new apiError(401,error?.message || "invalid access token")
   }

 });
