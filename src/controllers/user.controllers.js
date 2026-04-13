import {asyncHandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/User.model.js"
import {uploadToCloudinary} from "../utils/cloudnary.js"
import {ApiResponse} from "../utils/Apiresponse.js"


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
    const avatarLocalPath = req.files?.avathar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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




export {registerUser}