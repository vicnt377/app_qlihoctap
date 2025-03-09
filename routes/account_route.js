const express = require('express')
const router = express.Router()
const accountController = require('../controllers/AccountCotroller')

router.get('/account', accountController.index)

module.exports = router