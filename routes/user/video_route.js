const express = require('express')
const router = express.Router()
const videoController = require('../../controllers/user/VideoController') 
const accountController = require('../../controllers/user/AccountController')
const { isUser } = require('../../middlewares/authMiddleware')

router.get('/', videoController.getVideo) // Cho phép xem video mà không cần đăng nhập
router.post('/join/:id', isUser, videoController.joinVideo)

router.get('/showdetail/:id', videoController.showDetail) // Cho phép xem chi tiết video mà không cần đăng nhập
router.post('/:id/review', isUser, videoController.postReview);

router.get('/start/:id', isUser, videoController.startVideo)


module.exports = router