const Course = require('../models/Course')

class CourseController{
    index(req, res, next){
        res.render('course')
    }
}

module.exports = new CourseController();