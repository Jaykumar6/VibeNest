import {Router} from 'express'
import { createTweet, getUserTweets, updateTweet, deleteTweet} from '../controllers/tweet.controllers.js'

const router = Router()

router.route('/createTweet').post(createTweet)
router.route('/myTweets').get(getUserTweets)
router.route('/updateTweet/:tweetId').put(updateTweet)
router.route('/deleteTweet/:tweetId').delete(deleteTweet)

export default router