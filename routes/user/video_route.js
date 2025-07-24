const express = require('express')
const router = express.Router()
const videoController = require('../../controllers/user/VideoController') 
const accountController = require('../../controllers/user/AccountController')
const { isUser } = require('../../middlewares/authMiddleware')

router.get('/', isUser, videoController.getVideo)
router.post('/join/:id', isUser, videoController.joinVideo)

router.get('/showdetail/:id', isUser, videoController.showDetail)
router.post('/:id/review', isUser, videoController.postReview);

router.get('/start/:id', isUser, videoController.startVideo)


module.exports = router