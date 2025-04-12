const path = require('path')
const express = require('express')
const morgan = require('morgan')
const handlebars = require ('handlebars')
const { engine } = require('express-handlebars')
const session = require('express-session')
const flash = require('connect-flash')
const eflash = require('express-flash')
const bodyParser = require('body-parser')

const mongoose = require ('mongoose')

const app = express()
const port = 3000

const db = require('../config/database/db')
db.connect()

app.use(morgan('combined'))

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, 'public')))

app.use('/img', express.static(path.join(__dirname, 'public/img')))



app.engine('.hbs', engine({
  extname: '.hbs',
  helpers: {
    shortId: function (id) {
        return id ? id.toString().slice(-4) : ''
    },
    eq: (a, b) => a === b,
    ifEquals: (a, b, options) => (a === b ? options.fn(this) : options.inverse(this))
}
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
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 }
}));

handlebars.registerHelper('shortId', function(id) {
  if (id && typeof id.toString === 'function') {
    const idString = id.toString(); 
    return idString.substring(idString.length - 4)
  }
  return ''
});

// Middleware để truyền flash messages đến views
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    next();
});
app.use((req, res, next) => {
  res.locals.message = req.query.message || null
  next();
});


app.use((req, res, next) => {
  res.locals.successMessage = req.session.successMessage;
  res.locals.errorMessage = req.session.errorMessage;
  delete req.session.successMessage;
  delete req.session.errorMessage;
  next();
});





const route = require('../routes')
route(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})