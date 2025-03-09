const Progress = require('../models/Progress')

class ProgressController{
    index(req, res, next){
        res.render('progress')
    }
}

module.exports = new ProgressController();