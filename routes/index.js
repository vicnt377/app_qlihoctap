const scoreRouter = require('./score_route')
const loginRouter = require('./login_route')
const progressRouter = require('./progress_route')
const homeRouter = require('./home_route')
const courseRouter = require('./course_route')
const accountRouter = require('./account_route')
const registerRouter = require ('./register_route')
const semesterRouter = require ('./semester_route')

function route(app) {
    app.use('/score', scoreRouter);
    app.use('/login', loginRouter);
    app.use('/progress', progressRouter);
    app.use('/home', homeRouter);
    app.use('/course', courseRouter);
    app.use('/account', accountRouter); 
    app.use('/register', registerRouter);
    app.use('/semester', semesterRouter);
}

module.exports = route;




module.exports = route;