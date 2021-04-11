const path = require('path')

const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const errorController = require('./controllers/error')

const app = express()

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')

app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

// app.use((req, res, next) => {
//   User.findByPk('5baa2528563f16379fc8a610')
//     .then((user) => {
//       req.user = new User(user.name, user.email, user.cart, user._id)
//       next()
//     })
//     .catch((err) => console.log(err))
// })

app.use('/admin', adminRoutes)
app.use(shopRoutes)

app.use(errorController.get404)

mongoose
  .connect(
    process.env.MONGOOSE_URI,
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
    }
  )
  .then((result) => {
    app.listen(3000)
  })
  .catch((err) => {
    console.log(err)
  })
