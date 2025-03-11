const path = require('path')
const express = require('express')
const morgan = require('morgan')
const { engine } = require('express-handlebars')
const session = require('express-session');
const flash = require('connect-flash');

const mongoose = require ('mongoose')

const app = express()
const port = 3000

const db = require('../config/database/db')
db.connect()

app.use(morgan('combined'))

app.use(express.static(path.join(__dirname, 'public')))

app.engine('.hbs', engine({
  extname: '.hbs'
}))
app.set('view engine', '.hbs') 
app.set('views',  path.join(__dirname, 'resources/views'))

app.use(express.urlencoded({
  extended: true
}))
app.use(express.json())
app.use(session({
  secret: 'my_secret_key',
  resave: false,
  saveUninitialized: true
}));


// Middleware để truyền flash messages đến views
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

const route = require('../routes')
route(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})