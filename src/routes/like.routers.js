import {Router} from "express"
import {toggleLikevedio,commentlike,tweetLike,getLikedVideos} from "../controllers/like.controllers.js"
import router from "./user.routes.js"


const router = Router()

router.route("/videos/:videoId").post(toggleLikevedio)
router.route("/comments/:commentId").post(commentlike)
router.route("/tweets/:tweetId").post(tweetLike)
router.route("/videos").get(getLikedVideos)

export default router