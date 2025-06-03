//user
const scoreRouter = require('./score_route')
const loginRouter = require('./login_route')
const progressRouter = require('./progress_route')
const homeRouter = require('./home_route')
const courseRouter = require('./course_route')
const accountRouter = require('./account_route')
const registerRouter = require ('./register_route')
const semesterRouter = require ('./semester_route')
const documentRouter = require ('./document_route')
const videoRouter = require ('./video_route')

//admin
const adminRouter = require('./admin_route');


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
}

module.exports = route;
