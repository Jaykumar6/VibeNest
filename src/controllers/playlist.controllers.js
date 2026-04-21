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
    user: req.user._id,
    vedios: [],
  });
  if (!Playlist) throw new ApiError(500, "failed to create playlist");
  return res
    .status(201)
    .json(new ApiResponse(true, Playlist, "playlist created successfully"));
});

const addVedioToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, vedioId } = req.params;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "valid playlist id is required");
  const Playlist = await playlist.findById(playlistId);
  if (!Playlist) throw new ApiError(404, "playlist not found");
  if (Playlist.user.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  if (Playlist.vedios.includes(vedioId))
    throw new ApiError(400, "video already exists in the playlist");
  const updatePlaylist = await playlist.findByidAndUpdate(
    playlistId,
    { $push: { vedios: vedioId } },
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

const removevedioFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, vedioId } = req.params;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "valid playlist id is required");
  if (!isValidObjectId(vedioId))
    throw new ApiError(400, "valid video id is required");
  const findPlaylist = await playlist.findById(playlistId);
  if (!findPlaylist) throw new ApiError(404, "playlist not found");
  if (findPlaylist.user.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  const updateplaylist = await playlist.findByidAndUpdate(
    playlistId,
    { $pull: { vedios: vedioId } },
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
  if (findplaylistId.user.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  const updateplaylist = await playlist.findByidAndUpdate(
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
  if (findplaylist.user.toString() !== req.user._id.toString())
    throw new ApiError(403, "you are not authorized to modify this playlist");
  await playlist.findByidAndDelete(playlistId);
  res
    .status(200)
    .json(new ApiResponse(true, {}, "playlist deleted successfully"));
});
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlists = await Playlist.aggregate([
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

  const playlist = await Playlist.aggregate([
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

  if (!playlist?.length) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

export {
  createplaylist,
  addVedioToPlaylist,
  removevedioFromPlaylist,
  updateplaylist,
  deleteplaylist,
};
