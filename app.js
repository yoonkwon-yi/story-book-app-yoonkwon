// building backend server routes
const express = require('express')
// access config variables
const dotenv = require('dotenv')
// get session info with connect-mongo
const mongoose = require('mongoose')
//connect DB from config/db
const connectDB = require('./config/db')
//passport authen
const passport = require('passport')
//passport sesion
const session = require('express-session')
//overide for editting post --PUT and DELETE instead of POST
const methodOverride = require('method-override')
//morgan for LOG
const morgan = require('morgan')
//setup template engine  using handlebars
const exphbs = require('express-handlebars')
//STORE SESSION info -- passing session from above and pass in
const MongoStore = require('connect-mongo')
//
const path = require('path')

//loading config file
dotenv.config({ path: './config/config.env' })

//passport config --pass in passport argument into
require('./config/passport')(passport)

connectDB()

const app = express()

//Body parse
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//Method override
app.use(
  methodOverride(function (req, res) {
    //look for _method and replace it whatever we want to replace

    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

//LOGGING
if (process.env.NODE_ENV === 'development') {
  //this shows http method etc on console when it's on dev mode
  app.use(morgan('dev'))
}

//Handlebars Helpers
const {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select
} = require('./helpers/hbs')

//HANDLEBARS (MIDDLEWARE)'
//default layout will cehck views/layouts folder
app.engine(
  '.hbs',
  exphbs({
    helpers: { formatDate, stripTags, truncate, editIcon, select },
    defaultLayout: 'main',
    extname: '.hbs'
  })
)
app.set('view engine', '.hbs')

//middleware for passport-session (MUST COME ABOVE possport)
app.use(
  // if nothing is modieid don't resave-- resave
  //don't create session until something is sotred -- saveUnitilaized
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  })
)

//middleware for passport
app.use(passport.initialize())
app.use(passport.session())

//set express global variables by using middleware
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})
//this will allow us to access logged in user info from our template
// set as null if it doesn't exist

// Static Folder
app.use(express.static(path.join(__dirname, 'public')))

// ROUTES
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

const PORT = process.env.PORT || 3000

app.listen(
  PORT,
  '0.0.0.0',
  console.log(`Server running in ${process.env.NODE_ENV} and PORT is ${PORT}`)
)
