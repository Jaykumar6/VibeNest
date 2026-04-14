import {asyncHandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/User.model.js"
import {uploadToCloudinary} from "../utils/cloudnary.js"
import {ApiResponse} from "../utils/Apiresponse.js"

const generateAccessAndRefershTokens = async (userId)=>{
  try{
   const user = await User.findById(userId)
   const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
   }catch(error){
    throw new ApiError(500,"Failed to generate tokens")
  }
}


const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body

  // 1. Check empty fields
  if (
    [username, email, password, fullName].some((field) => {
      return field?.trim() === ""
    })
  ) {
    throw new ApiError(400, "All fields are required")
  }

  // 2. Check existing user
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  })

  if (existingUser) {
    throw new ApiError(
      400,
      "User with the same email or username already exists"
    );
  }
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
      throw new ApiError(400,"Avatar Image is required")
    }
  const avatar = await uploadToCloudinary(avatarLocalPath)
  const coverImage = await uploadToCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(500,"Failed to upload avatar image")
  }
  const user = await User.create({
    username:username.toLowerCase(),
    email,
    password,
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || ""


  })
  const createdUser = await User.findById(user._id).select("-password -refershToken")
  if(!createdUser){
    throw new ApiError(500,"Failed to create user")
  }
  return res.status(200).json(new ApiResponse(201,createdUser,"User registered successfully"))

})


const loginUser = asyncHandler(async(req,res)=>{
  const {email,username,password} = req.body
  if(!email || !username){
    throw new ApiError(400,"Email or username is required")
  }

  const user = await User.findOne({$or:[{email},{username}]}) 
  if(!user){
    throw new ApiError (404,"User not found please Register")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401,"Invalid Password")
  }
  const {accessToken,refershToken} = await generateAccessAndRefershTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refershToken")

  //cookies
  const option = {
    httpOnly:true,
    secure:true
  }
  return res.status(200).cookie('accessToken',accessToken,option).cookie('refershToken',refershToken,option).json(new ApiResponse(200,{user:loggedInUser,accessToken,refershToken},"User logged in successfully"))
})

const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(req.user._id,{$set:{refreshToken:"undefined"}},{new:true})
  const option = {
    httpOnly:true,
    secure:true
  }
  return res.status(200).clearcookie('accessToken',option).clearcookie('refershToken',option).json(new ApiResponse(200,{},"User logged out successfully"))
})

export {registerUser,loginUser,logoutUser}