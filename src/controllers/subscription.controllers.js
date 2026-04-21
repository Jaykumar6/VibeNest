import mongoose, {isValidObjectId} from 'mongoose'
import user from '../models/user.model.js'
import Subscription from '../models/subscription.js'
import { Video } from '../models/video.model.js'
import { Like } from '../models/like.model.js'
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from '../utils/Apiresponse.js'
import { asyncHandler } from '../utils/asynchandler.js'

const getChannelStats = asyncHandler(async(req,res)=>{
    const channelId = req.user._id

    const totalSubscribers = await Subscription.countDocuments({channel:channelId})
    const videoStats = await Video.aggregate([
        {$match:{
            owner: new mongoose.Types.ObjectId(channelId)
        }},
        {$group:{
            _id:null,
            totalViews:{$sum:'$views'},
            totalVideos:{$sum:1}
        }}
    ])
    const likeStats = await Like.aggregate([
        {$lookup:{
            from:'videos',
            localField:'video',
            foreignField:'_id',
            as:'videoDetails'
        }},
        {$match:{
            'videoDetails.owner': new mongoose.Types.ObjectId(channelId),
            video:{$exists:true,$ne:null}
        }},{
            $count:'totalLikes'
        }
        
    
    ])
     const stats = {
        totalSubscribers,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: likeStats[0]?.totalLikes || 0
    }

    return res.status(200).json(
        new ApiResponse(200, stats, "Channel stats fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id
    const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortType = "desc",
        query = ""
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                // Optional search by title
                ...(query && {
                    title: { $regex: query, $options: "i" }
                })
            }
        },
        {
            // Get total likes per video
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isPublished: "$isPublished"
            }
        },
        {
            $project: {
                title: 1,
                thumbnail: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                likesCount: 1,
                createdAt: 1
            }
        },
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
        { $skip: skip },
        { $limit: limitNum }
    ])

    const totalVideos = await Video.countDocuments({
        owner: new mongoose.Types.ObjectId(channelId),
        ...(query && {
            title: { $regex: query, $options: "i" }
        })
    })

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalVideos / limitNum),
                totalVideos,
                hasNextPage: pageNum < Math.ceil(totalVideos / limitNum),
                hasPrevPage: pageNum > 1
            }
        }, "Channel videos fetched successfully")
    )
})

export {
    getChannelStats,
    getChannelVideos
}