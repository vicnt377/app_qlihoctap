const express = require('express')
const router = express.Router()
const registerController = require('../controllers/RegisterCotroller')

router.get('/register', registerController.index)
router.post('/register', registerController.register)

module.exports = router