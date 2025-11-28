const express = require('express');
const router = express.Router();
const videoController = require('../../controllers/admin/VideoController');
const { isAdmin } = require('../../middlewares/adminCheck');

// VIDEO
router.get('/videos', isAdmin, videoController.getVideos);
router.get('/videos/showdetail/:id', isAdmin, videoController.showDetail)
router.get('/videos/:id', isAdmin, videoController.getVideoById);
router.get('/videos/search', isAdmin, videoController.searchAndPreview);
router.get('/videos/youtube-search', isAdmin, videoController.searchAndPreview);
router.post('/videos/create', isAdmin, videoController.createVideo);
router.patch('/videos/:id/edit', isAdmin, videoController.editVideo);
router.delete('/videos/:id/delete', isAdmin, videoController.deleteVideo);

// Đánh giá và phản hồi
router.post('/videos/:videoId/reviews/:reviewId/reply', isAdmin, videoController.replyReview);
// Xóa vĩnh viễn
router.delete("/videos/:id/delete-permanent", videoController.deletePermanentVideo);
router.patch('/videos/:id/restore', isAdmin, videoController.restoreVideo);

module.exports = router;
