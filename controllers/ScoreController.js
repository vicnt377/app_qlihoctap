const Score = require('../models/Score')
const Course = require('../models/Course')
const Semester = require('../models/Semester')

class ScoreController{
    index(req, res, next){
        res.render('score')
    }

    
}


module.exports = new ScoreController();