const Document = require('../models/Document')

class DocumentController{
    async getDocument(req, res, next){
        try{
            const userId = req.user?._id || req.session?.user?._id;
            if (!userId) {
                return res.render('login'); 
            }

            res.render('user/document', {
                user: req.session.user,
            })
        }catch(error){
            next(error)
        }
    }
}

module.exports = new DocumentController();