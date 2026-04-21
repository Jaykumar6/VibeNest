import { Router } from "express"
import { getAllComments ,addcomment,deletecomment} from "../controllers/comment.controllers.js"

const router = Router()

router.route("/:videoId").get(getAllComments)
router.route("/:videoId/comments").post(addcomment)
router.route("/:delete/:commentId").delete(deletecomment)

export default router