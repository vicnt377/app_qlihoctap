//user
const scoreRouter = require('./user/score_route')
const loginRouter = require('./user/login_route')
const progressRouter = require('./user/progress_route')
const homeRouter = require('./user/home_route')
const courseRouter = require('./user/course_route')
const accountRouter = require('./user/account_route')
const registerRouter = require ('./user/register_route')
const semesterRouter = require ('./user/semester_route')
const documentRouter = require ('./user/document_route')
const videoRouter = require ('./user/video_route')
const chatRouter = require('./user/chat_route')



//admin
const adminRouter = require('./admin/admin_route')


function route(app) {

    app.use('/', loginRouter);
    
    //Admin
    app.use('/admin', adminRouter);

    //User
    app.use('/score', scoreRouter);
    app.use('/progress', progressRouter);
    app.use('/home', homeRouter);
    app.use('/course', courseRouter);
    app.use('/account', accountRouter); 
    app.use('/register', registerRouter);
    app.use('/semester', semesterRouter);
    app.use('/document', documentRouter);
    app.use('/video', videoRouter);
    app.use('/chat', chatRouter)
}

module.exports = route;
