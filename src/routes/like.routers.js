import {Router} from "express"
import {toggleLikeVideo,commentLike,tweetLike,getLikedVideos} from "../controllers/like.controllers.js"
import router from "./user.routes.js"


const routers = Router()

routers.route("/videos/:videoId").post(toggleLikeVideo)
routers.route("/comments/:commentId").post(commentLike)
routers.route("/tweets/:tweetId").post(tweetLike)
routers.route("/videos").get(getLikedVideos)

export default router