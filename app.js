const path = require('path')

const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const csrf = require('csurf')
const flash = require('connect-flash')
require('dotenv').config()

const errorController = require('./controllers/error')
const User = require('./models/user')

const app = express()
const store = new MongoDBStore({
  uri: process.env.MONGOOSE_URI,
  collection: 'sessions',
}) // fetches data from mongodb but not as an object like how mongoose would.

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const authRoutes = require('./routes/auth')

app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
)
app.use(csrf())
app.use(flash())

// adds middleware so mongoose methods will work with req.session again
app.use((req, res, next) => {
  if (!req.session.user) {
    return next()
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next()
      }
      req.user = user
      next()
    })
    .catch((err) => {
      throw new Error(err)
    })
})

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get('/500', errorController.get500)

app.use(errorController.get404)

// special type of middleware for error handling
app.use((err, req, res, next) => {
  console.log(err)
  // res.render(err.httpStatusCode).render('/500')
  res.redirect('/500')
})

mongoose
  .connect(process.env.MONGOOSE_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(3000)
  })
  .catch((err) => {
    console.log(err)
  })
