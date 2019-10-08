const express = require('express')
const session = require('express-session')
const MongoSore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markDown = require('marked')
const sanitizeHTML = require('sanitize-html')



const app = express()

let sessionOptions = session({
  secret: 'i love the Lord',
  store: new MongoSore({client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash())

app.use(function(req, res, next){
  //make markdown available
  res.locals.filterUserHTML = function(content){
    return sanitizeHTML(markDown(content), {allowedTags:['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes:{}})
  }

  //make flash pacakage available
  res.locals.errors = req.flash('errors')
  res.locals.success = req.flash('success')


  //make visitor id available
if(req.session.user){req.visitorId = req.session.user._id}else{req.visitorId = 0}
  //make user info available on every requets
  res.locals.user = req.session.user
  next()
})

app.use(express.urlencoded({extended: false}))
app.use(express.json())


const router = require('./router')

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use('/', router)


module.exports = app