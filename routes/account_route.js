const express = require('express')
const router = express.Router()
const accountController = require('../controllers/AccountCotroller')
const multer = require('multer')
const path = require('path')
const User = require('../models/User')


router.get('/account', accountController.index)


module.exports = router