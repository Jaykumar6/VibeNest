import mongoose, { isValidObjectId } from "mongooes";
import Tweet from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === "")
    throw new ApiError(400, "content is required");
  if (content.length > 200)
    throw new ApiError(400, "content  should be less then 200 characters");
  const newTweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id,
  });
  if (!newTweet) throw new ApiError(500, "Failed to create Tweet");
  return res.status(200).json(new ApiResponse(true));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      // Join owner details
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: { username: 1, avatar: 1 },
          },
        ],
      },
    },
    {
      // Join likes for each tweet
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: { $first: "$ownerDetails" },
        likesCount: { $size: "$likes" },
        // Check if the logged-in user has liked this tweet
        isLiked: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user._id),
                "$likes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
    { $skip: skip },
    { $limit: limitNum },
  ]);

  const totalTweets = await Tweet.countDocuments({
    owner: new mongoose.Types.ObjectId(userId),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tweets,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalTweets / limitNum),
          totalTweets,
          hasNextPage: pageNum < Math.ceil(totalTweets / limitNum),
          hasPrevPage: pageNum > 1,
        },
      },
      "User tweets fetched successfully",
    ),
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");
  if (!content || content.trim() === "")
    throw new ApiError(400, "content is required");
  if (content.length > 200)
    throw new ApiError(400, "content should be less than 200 characters");
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content: content.trim() },
    { new: true },
  );
  if (!updatedTweet) throw new ApiError(404, "Tweet not found");
  if (updatedTweet.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You are not the owner of this tweet");
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet Id");
  const deletedTweet = await Tweet.findById(tweetId);
  if (!deletedTweet) throw new ApiError(404, "Tweet not Found");
  if (deletedTweet.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You are not the owner of this tweet");
  await deletedTweet.findByIdAndDelete(tweetId);
  await Like.deleteMany({ tweet: tweetId });
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
