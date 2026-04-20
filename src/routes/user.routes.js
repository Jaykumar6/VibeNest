import { Router } from "express"
import { registerUser,loginUser,logoutUser,RefreshAccessToken,changePassword,getUserProfile ,updateUserProfile,updateUserAvatar,updateCoverImage,getUserChannelProfile,getUserWatchHistory} from "../controllers/user.controllers.js"
import {upload} from '../middlewares/multer.middleware.js'
import { verifyjwt } from "../middlewares/auth.middleware.js"


const router = Router()

router.route('/register').post(upload.fields([{name:'avatar', maxCount: 1},{name:'coverImage', maxCount: 1}]), registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyjwt,logoutUser)
router.route('/refresh-token').post(RefreshAccessToken)
router.route('/change-password').post(verifyjwt,changePassword)
router.route('/profile').get(verifyjwt,getUserProfile)
router.route('/update-profile').put(verifyjwt,updateUserProfile)
router.route('/update-avatar').patch(verifyjwt,upload.single('avatar'),updateUserAvatar)
router.route('/update-cover-image').patch(verifyjwt,upload.single('coverImage'),updateCoverImage)
router.route('/c/:username').get(verifyjwt,getUserChannelProfile)
router.route('/watch-history').get(verifyjwt,getUserWatchHistory)









export default router 