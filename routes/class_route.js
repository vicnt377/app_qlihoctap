const express = require('express')
const router = express.Router()
const classController = require('../controllers/ClassController')

router.get('/class', classController.index)

module.exports = router