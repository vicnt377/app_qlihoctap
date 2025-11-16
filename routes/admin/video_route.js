const express = require('express');
const router = express.Router();
const videoController = require('../../controllers/admin/VideoController');
const { isAdmin } = require('../../middlewares/adminCheck');

// VIDEO
router.get('/videos', isAdmin, videoController.getVideos);
router.get('/videos/search', isAdmin, videoController.searchAndPreview);
router.get('/videos/youtube-search', isAdmin, videoController.searchAndPreview);
router.post('/videos/create', isAdmin, videoController.createVideo);
router.patch('/videos/:id/edit', isAdmin, videoController.editVideo);
router.delete('/videos/:id/delete', isAdmin, videoController.deleteVideo);
router.patch('/videos/:id/restore', isAdmin, videoController.restoreVideo);

module.exports = router;
