import { Router } from "express";
import {
	createplaylist,
	deleteplaylist,
	getUserPlaylists,
	getPlaylistById,
	updateplaylist,
	removeVideoFromPlaylist,
	addVideoToPlaylist,
} from "../controllers/playlist.controllers.js";

const router = Router()

router.route("/create").post(createplaylist)
router.route("/all/:userId").get(getUserPlaylists)
router.route("/:playlistId").get(getPlaylistById)
router.route("/:playlistId").put(updateplaylist)
router.route("/:playlistId").delete(deleteplaylist)
router.route("/:playlistId/videos/:videoId").post(addVideoToPlaylist)
router.route("/:playlistId/videos/:videoId").delete(removeVideoFromPlaylist)

export default router