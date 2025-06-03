const Video = require('../models/Video')

class VideoController{
    async getVideo(req, res, next){
        try{
            const userId = req.user?._id || req.session?.user?._id;
            if (!userId) {
                return res.render('login'); 
            }

            res.render('user/video', {
                user: req.session.user,
            })
        }catch(error){
            next(error)
        }
    }
}

module.exports = new VideoController();