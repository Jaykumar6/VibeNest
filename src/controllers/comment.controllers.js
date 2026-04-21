import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/Apiresponse.js"
import { asyncHandler } from "../utils/asynchandler.js"


const getAllComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query

    if (!videoId) {
        throw new ApiError(400, "video id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "valid video id is required")
    }

    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                user: {
                    $first: "$user"
                }
            }
        }
    ])

    const comments = await Comment.aggregatePaginate(aggregate, {
        page: Number(page),
        limit: Number(limit),
        sort: {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    })

    return res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    )
})

const addcomment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {content} = req.body
    if(!mongoose.Types.ObjectId.isValid(videoId)) throw new ApiError(400,"valid video Id is required")
    if(!content || content.trim() === "")  throw new ApiError(400,"comment content is required")  

          const newComment = await Comment.create({
     content: content.trim(),
     video: videoId,
      user: req.user._id 
    })
    if(!newComment) throw new ApiError(404,"failed to add comment")

        return res.status(201).json(new ApiResponse(201,newComment,"comment added successfully"))

}) 

const deletecomment  = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!mongoose.Types.ObjectId.isValid(commentId)) throw new ApiError(400,"valid comment Id is required")
        const foundcomment = await Comment.findByIdAndDelete(commentId)
        if(!foundcomment) throw new ApiError(403,"comment not found")
            if(foundcomment.user.toString() !== req.user._id.toString()) throw new ApiError(404,"you are not authorized to delete this comment")
        return res.status(200).json(new ApiResponse(200, null, "comment deleted successfully"))

})

export { getAllComments, addcomment, deletecomment }
