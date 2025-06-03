const express = require('express')
const router = express.Router()
const documentController = require('../controllers/DocumentController')

router.get('/', documentController.getDocument)





module.exports = router