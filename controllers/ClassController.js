const Class = require('../models/Class')

class ClassController{
    index(req, res, next){
        res.render('class')
    }
}

module.exports = new ClassController();