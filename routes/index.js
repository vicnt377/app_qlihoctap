const scoreRouter = require('./score_route')
const loginRouter = require('./login_route')
const progressRouter = require('./progress_route')
const homeRouter = require('./home_route')
const courseRouter = require('./course_route')
const classRouter = require('./class_route')
const accountRouter = require('./account_route')
const registerRouter = require ('./register_route')
const semesterRouter = require ('./semester_route')

function route (app){
    app.use('/',scoreRouter,loginRouter,progressRouter, homeRouter, courseRouter, classRouter,accountRouter,registerRouter, semesterRouter)
}



module.exports = route;