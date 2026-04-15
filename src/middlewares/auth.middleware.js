import { asyncHandler } from "../utils/asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


export const verifyjwt = asyncHandler(async(req,_,next)=>{
   try{
         const authorizationHeader = req.header("Authorization") || req.header("authorization")
         const token = req.cookies?.accessToken || authorizationHeader?.replace(/^Bearer\s+/i, "").trim()
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
    throw new ApiError(401, error.message || "Invalid Access Token")
}
})