import { Router } from "express";
import { createPlaylist, deletePlaylist, getAllPlaylists, getPlaylistById, updatePlaylist ,removevedioFromPlaylist,addVedioToPlaylist} from "../controllers/playlist.controller.js";

const router = Router()

router.route("/create").post(createPlaylist)
router.route("/all").get(getAllPlaylists)
router.route("/:playlistId").get(getPlaylistById)
router.route("/:playlistId").put(updatePlaylist)
router.route("/:playlistId").delete(deletePlaylist)
router.route("/:playlistId/videos/:videoId").post(addVedioToPlaylist)
router.route("/:playlistId/videos/:videoId").delete(removevedioFromPlaylist)

export default router