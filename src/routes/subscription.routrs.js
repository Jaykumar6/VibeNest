import { Router } from "express";
import {  getChannelStats, getChannelVideos} from '../controllers/subscription.controllers.js';
import { verifyjwt } from "../middlewares/auth.middleware.js";


const router = Router()
router.use(verifyjwt)

router.route("/stats").get(getChannelStats)
router.route("/videos").get(getChannelVideos)

export default router