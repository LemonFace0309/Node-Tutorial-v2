const bcrypt = require('bcryptjs')

const User = require('../models/user')

exports.getLogin = (req, res, next) => {
  // const isLoggedIn =
  //   req.get('Cookie').split(';')[1].trim().split('=')[1] == true
  const errorFlash = req.flash('error')
  const error = errorFlash.length > 0 ? errorFlash[0] : null 
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: error
  })
}

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Invalid email or password.')
        return res.redirect('/login')
      }
      return bcrypt
        .compare(password, user.password)
        .then((matched) => {
          if (matched) {
            req.session.isLoggedIn = true
            req.session.user = user
            // return is necessary to execute callback function
            //   immediately afterwards
            return req.session.save((err) => {
              console.log(err)
              res.redirect('/')
            })
          }
          return res.redirect('/login')
        })
        .catch((err) => {
          console.log(err)
          res.redirect('/login')
        })
    })
    .catch((err) => {
      console.log(err)
    })
}

// exports.postLogin = (req, res, next) => {
//   // res.setHeader('Set-Cookie', 'loggedIn=true')
//   User.findById('6072a792f323cc22801c8abd')
//     .then((user) => {
//       // req.session is an object provided by express-session. It will be
//       // present in all requests
//       req.session.isLoggedIn = true
//       req.session.user = user
//       // usually unnecessary but we added it so res.redirect('/')
//       //   doesn't occur before req.session finishes sending data to the store
//       req.session.save((err) => {
//         console.log(err)
//         res.redirect('/')
//       })
//     })
//     .catch((err) => console.log(err))
// }

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        return res.redirect('/signup')
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          })
          return user.save()
        })
        .then((result) => {
          res.redirect('/login')
        })
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/')
  })
}
