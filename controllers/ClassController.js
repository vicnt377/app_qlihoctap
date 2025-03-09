const Class = require('../models/Class')

class ClassController{
    index(req, res, next){
        res.render('class_events')
    }
}

module.exports = new ClassController();