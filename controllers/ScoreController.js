const Score = require('../models/Score')

class ScoreController{
    index(req, res, next){
        res.render('score')
    }
}

module.exports = new ScoreController();