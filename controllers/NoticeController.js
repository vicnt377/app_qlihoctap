const Notice= require('../models/Notice')

class NoticeController{
    index(req, res, next){
        res.render('notice')
    }
}

module.exports = new NoticeController();