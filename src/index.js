const path = require('path')
const express = require('express')
const morgan = require('morgan')
const { engine } = require('express-handlebars')

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



const route = require('../routes')
route(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})