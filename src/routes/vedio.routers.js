import {Router} from 'express'
import { getAllVideos,publishAVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus} from '../controllers/video.controllers.js'

const router = Router()

router.route('/').get(getAllVideos)
router.route('/publish').post(publishAVideo)
router.route('/getVideoById/:videoId').get(getVideoById)
router.route('/:videoId').get(getVideoById).put(updateVideo).delete(deleteVideo)
router.route('/togglePublish/:videoId').put(togglePublishStatus)    

export default router