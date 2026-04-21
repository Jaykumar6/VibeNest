import mongoose, { isValidObjectId } from "mongoose";
import playlist from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";

const createplaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || name.trim() === "")
    throw new ApiError(400, "playlist name is required");

  const Playlist = await playlist.create({
    name: name.trim(),
    description: description?.trim() || "",
    owner: req.user._id,
    videos: [],
  });
  if (!Playlist) throw new ApiError(500, "failed to create playlist");
  return res
    .status(201)
    .json(new ApiResponse(true, Playlist, "playlist created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "valid playlist id is required");
  const Playlist = await playlist.findById(playlistId);
  if (!Playlist) throw new ApiError(404, "playlist not found");
  if (Playlist.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  if (Playlist.videos.includes(videoId))
    throw new ApiError(400, "video already exists in the playlist");
  const updatePlaylist = await playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true },
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        true,
        updatePlaylist,
        "video added to playlist successfully",
      ),
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "valid playlist id is required");
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "valid video id is required");
  const findPlaylist = await playlist.findById(playlistId);
  if (!findPlaylist) throw new ApiError(404, "playlist not found");
  if (findPlaylist.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  const updateplaylist = await playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true },
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        true,
        updateplaylist,
        "video removed from playlist successfully",
      ),
    );
});

const updateplaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "valid playlist id is required");
  if (!name || name.trim() === "")
    throw new ApiError(400, "playlist name is required");
  const findplaylistId = await playlist.findById(playlistId);
  if (!findplaylistId) throw new ApiError(404, "playlist not found");
  if (findplaylistId.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  const updateplaylist = await playlist.findByIdAndUpdate(
    playlistId,
    { name: name.trim(), description: description?.trim() || "" },
    { new: true },
  );
  return res
    .status(200)
    .json(
      new ApiResponse(true, updateplaylist, "playlist updated successfully"),
    );
});
const deleteplaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "valid playlist Id is required");
  const findplaylist = await playlist.findById(playlistId);
  if (!findplaylist) throw new ApiError(404, "playlist not found");
  if (findplaylist.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  await playlist.findByIdAndDelete(playlistId);
  res
    .status(200)
    .json(new ApiResponse(true, {}, "playlist deleted successfully"));
});
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlists = await playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      // Join videos inside the playlist
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
        // Return only the first video's thumbnail as cover
        coverThumbnail: { $first: "$videos.thumbnail" },
      },
    },
    {
      $sort: { updatedAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully"),
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlistData = await playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      // Join full video details
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            // Join each video's owner
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: { username: 1, avatar: 1 },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      // Join playlist owner details
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: { username: 1, avatar: 1 },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        totalVideos: 1,
        totalViews: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!playlistData?.length) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlistData[0], "Playlist fetched successfully"));
});

export {
  createplaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updateplaylist,
  deleteplaylist,
};
