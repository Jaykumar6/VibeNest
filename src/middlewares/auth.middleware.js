import { asyncHandler } from "../utils/asynchandler"
import { ApiError } from "../utils/ApiError"
import jwt from "jsonwebtoken"
import { User } from "../models/User.model"


export const verifyjwt = asyncHandler(async(req,res,next)=>{
   try{
     const token =req.cookies?.accessToken ||  req.header("Authorization")?.replace("bearer ","")
    if(!token){
        throw new ApiError(401,"Unauthorized")
    }
    const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decoded._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(401,"Unauthorized")
    }
    req.user = user
    next()
   }
   catch(error){
    throw new ApiError(401,"Invalid Access Token")
   }
})