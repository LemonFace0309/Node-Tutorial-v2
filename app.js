const path = require('path')

const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
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

// re-add middleware so mongoose methods will work with req.session again
app.use((req, res, next) => {
  if (!req.session.user) {
    return next()
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user
      next()
    })
    .catch((err) => console.log(err))
})

app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.use(errorController.get404)

mongoose
  .connect(process.env.MONGOOSE_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: 'Charles',
          email: 'test@test.com',
          cart: {
            items: [],
          },
        })
        user.save()
      }
    })
    app.listen(3000)
  })
  .catch((err) => {
    console.log(err)
  })
