import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 10,
		query = "",
		sortBy = "createdAt",
		sortType = "desc",
		userId
	} = req.query

	const pageNum = parseInt(page)
	const limitNum = parseInt(limit)
	const skip = (pageNum - 1) * limitNum

	const matchStage = {
		isPublished: true,
		...(query && {
			$or: [
				{ title: { $regex: query, $options: "i" } },
				{ description: { $regex: query, $options: "i" } }
			]
		}),
		...(userId && isValidObjectId(userId) && {
			owner: new mongoose.Types.ObjectId(userId)
		})
	}

	const videos = await Video.aggregate([
		{ $match: matchStage },
		{
			$lookup: {
				from: "users",
				localField: "owner",
				foreignField: "_id",
				as: "ownerDetails",
				pipeline: [
					{
						$project: { username: 1, avatar: 1 }
					}
				]
			}
		},
		{
			$lookup: {
				from: "likes",
				localField: "_id",
				foreignField: "video",
				as: "likes"
			}
		},
		{
			$addFields: {
				owner: { $first: "$ownerDetails" },
				likesCount: { $size: "$likes" }
			}
		},
		{
			$project: {
				title: 1,
				description: 1,
				thumbnail: 1,
				videoFile: 1,
				duration: 1,
				views: 1,
				isPublished: 1,
				owner: 1,
				likesCount: 1,
				createdAt: 1
			}
		},
		{ $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
		{ $skip: skip },
		{ $limit: limitNum }
	])

	const totalVideos = await Video.countDocuments(matchStage)

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
		}, "Videos fetched successfully")
	)
})

const publishAVideo = asyncHandler(async (req, res) => {
	const { title, description } = req.body

	if (!title || title.trim() === "") {
		throw new ApiError(400, "Title is required")
	}

	if (!description || description.trim() === "") {
		throw new ApiError(400, "Description is required")
	}

	const videoLocalPath = req.files?.videoFile?.[0]?.path
	const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

	if (!videoLocalPath) {
		throw new ApiError(400, "Video file is required")
	}

	if (!thumbnailLocalPath) {
		throw new ApiError(400, "Thumbnail is required")
	}

	const videoFile = await uploadOnCloudinary(videoLocalPath)
	const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

	if (!videoFile?.url) {
		throw new ApiError(500, "Failed to upload video file")
	}

	if (!thumbnail?.url) {
		throw new ApiError(500, "Failed to upload thumbnail")
	}

	const video = await Video.create({
		title: title.trim(),
		description: description.trim(),
		videoFile: videoFile.url,
		thumbnail: thumbnail.url,
		duration: videoFile.duration,
		owner: req.user._id,
		isPublished: true
	})

	if (!video) {
		throw new ApiError(500, "Failed to publish video")
	}

	return res.status(201).json(
		new ApiResponse(201, video, "Video published successfully")
	)
})

const getVideoById = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID")
	}

	const video = await Video.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(videoId)
			}
		},
		{
			$lookup: {
				from: "users",
				localField: "owner",
				foreignField: "_id",
				as: "owner",
				pipeline: [
					{
						$lookup: {
							from: "subscriptions",
							localField: "_id",
							foreignField: "channel",
							as: "subscribers"
						}
					},
					{
						$addFields: {
							subscribersCount: { $size: "$subscribers" },
							isSubscribed: {
								$cond: {
									if: { $in: [req.user._id, "$subscribers.subscriber"] },
									then: true,
									else: false
								}
							}
						}
					},
					{
						$project: {
							username: 1,
							avatar: 1,
							subscribersCount: 1,
							isSubscribed: 1
						}
					}
				]
			}
		},
		{
			$lookup: {
				from: "likes",
				localField: "_id",
				foreignField: "video",
				as: "likes"
			}
		},
		{
			$addFields: {
				owner: { $first: "$owner" },
				likesCount: { $size: "$likes" },
				isLiked: {
					$cond: {
						if: { $in: [req.user._id, "$likes.likedBy"] },
						then: true,
						else: false
					}
				}
			}
		},
		{
			$project: {
				title: 1,
				description: 1,
				videoFile: 1,
				thumbnail: 1,
				duration: 1,
				views: 1,
				isPublished: 1,
				owner: 1,
				likesCount: 1,
				isLiked: 1,
				createdAt: 1
			}
		}
	])

	if (!video?.length) {
		throw new ApiError(404, "Video not found")
	}

	await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

	await User.findByIdAndUpdate(req.user._id, {
		$addToSet: { watchHistory: videoId }
	})

	return res.status(200).json(
		new ApiResponse(200, video[0], "Video fetched successfully")
	)
})

const updateVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params
	const { title, description } = req.body

	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID")
	}

	if (!title || title.trim() === "") {
		throw new ApiError(400, "Title is required")
	}

	if (!description || description.trim() === "") {
		throw new ApiError(400, "Description is required")
	}

	const video = await Video.findById(videoId)

	if (!video) {
		throw new ApiError(404, "Video not found")
	}

	if (video.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You are not allowed to update this video")
	}

	let thumbnailUrl = video.thumbnail
	const thumbnailLocalPath = req.file?.path

	if (thumbnailLocalPath) {
		const oldThumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0]
		await deleteFromCloudinary(oldThumbnailPublicId)

		const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

		if (!newThumbnail?.url) {
			throw new ApiError(500, "Failed to upload new thumbnail")
		}

		thumbnailUrl = newThumbnail.url
	}

	const updatedVideo = await Video.findByIdAndUpdate(
		videoId,
		{
			$set: {
				title: title.trim(),
				description: description.trim(),
				thumbnail: thumbnailUrl
			}
		},
		{ new: true }
	)

	return res.status(200).json(
		new ApiResponse(200, updatedVideo, "Video updated successfully")
	)
})

const deleteVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID")
	}

	const video = await Video.findById(videoId)

	if (!video) {
		throw new ApiError(404, "Video not found")
	}

	if (video.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You are not allowed to delete this video")
	}

	const videoPublicId = video.videoFile.split("/").pop().split(".")[0]
	const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0]

	await deleteFromCloudinary(videoPublicId, "video")
	await deleteFromCloudinary(thumbnailPublicId)

	await Video.findByIdAndDelete(videoId)

	await Like.deleteMany({ video: videoId })
	await Comment.deleteMany({ video: videoId })

	return res.status(200).json(
		new ApiResponse(200, {}, "Video deleted successfully")
	)
})

const togglePublishStatus = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID")
	}

	const video = await Video.findById(videoId)

	if (!video) {
		throw new ApiError(404, "Video not found")
	}

	if (video.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You are not allowed to change publish status of this video")
	}

	const updatedVideo = await Video.findByIdAndUpdate(
		videoId,
		{ $set: { isPublished: !video.isPublished } },
		{ new: true }
	)

	return res.status(200).json(
		new ApiResponse(200, {
			isPublished: updatedVideo.isPublished
		}, `Video ${updatedVideo.isPublished ? "published" : "unpublished"} successfully`)
	)
})

export {
	getAllVideos,
	publishAVideo,
	getVideoById,
	updateVideo,
	deleteVideo,
	togglePublishStatus
}