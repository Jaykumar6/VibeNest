import mongoose,{isValidObjectId} from 'mongoose'
import { asyncHandler } from '../utils/asynchandler'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/Apiresponse'
import { Like, like } from '../models/like.model'


const toggleLikevedio = asyncHandler(async(req,res)=>{
    const {vidioId} = req.params
    if(!isValidObjectId(vidioId)) throw new ApiError(400,"valid video id is required")

        const existingLike = await Like.findOne({user:req.user._id,vidio:vidioId})
        if(existingLike){ await like.findByIdAndDelete(existingLike._id)
            return res.status(200).json(new ApiResponse(true,"like removed successfully"))
        }
        await like.create({user:req.user._id,vidio:vidioId})
        return res.status(200).json(new ApiResponse(true,"like added successfully"))
})

const {commentlike} = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!isValidObjectId(commentId)) throw new ApiError(400,"valid comment id is required")
        const existingLike = await like.findOne({user:req.user._id,comment:commentId})
    if(existingLike) await Like.findByIdAndDelete(existingLike._id)

        await Like.create({user:req.user._id,comment:commentId})
        return res.status(200).json(new ApiResponse(true,"like added successfully"))
})

const {tweetLike} = asyncHandler(async(req,res)=>{
    const{tweetId} = req.params
    if(!isValidObjectId(tweetId)) throw new ApiError(400,"valid tweet id is required")
        const existingLike = await Like.findOne({user:req.user._id,tweet:tweetId})
    if(existingLike) await Like.findByIdAndDelete(existingLike._id)
        await Like.create({user:req.user._id,tweet:tweetId})
        return res.status(200).json(new ApiResponse(true,"like added successfully"))
})


const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            // Match only video likes by the logged-in user
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            // Join with videos collection
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        // Join video owner details
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: { username: 1, avatar: 1 }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoDetails: { $first: "$videoDetails" }
            }
        },
        {
            // Filter out likes where video may have been deleted
            $match: {
                videoDetails: { $ne: null }
            }
        },
        {
            $project: {
                _id: 0,
                videoDetails: 1,
                likedAt: "$createdAt"
            }
        },
        {
            $sort: { likedAt: -1 }   // most recently liked first
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            { likedVideos, total: likedVideos.length },
            "Liked videos fetched successfully"
        )
    )
})


export {toggleLikevedio,commentlike,tweetLike,getLikedVideos}