const express = require('express')
const router = express.Router()
const registerController = require('../../controllers/user/RegisterCotroller')

router.get('/', registerController.index)
router.post('/', registerController.register)

module.exports = router