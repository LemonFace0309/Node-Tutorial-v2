const crypto = require('crypto')

const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')
const { validationResult } = require('express-validator')
require('dotenv').config()

const User = require('../models/user')

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_KEY,
    },
  })
) // executing sendgridTranport returns a configuration for nodemailer to use sendgrid

exports.getLogin = (req, res, next) => {
  // const isLoggedIn =
  //   req.get('Cookie').split(';')[1].trim().split('=')[1] == true
  const errorFlash = req.flash('error')
  const error = errorFlash.length > 0 ? errorFlash[0] : null
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: error,
  })
}

exports.getSignup = (req, res, next) => {
  const errorFlash = req.flash('error')
  const error = errorFlash.length > 0 ? errorFlash[0] : null
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: error,
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
          req.flash('error', 'Invalid password')
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
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
    })
  }
  bcrypt
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
      return transporter.sendMail({
        to: email,
        from: process.env.SENDER_EMAIL,
        subject: 'Signed Up Successfully',
        html: '<h1>Congratulations on Signing up with us!</h1>',
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

exports.getReset = (req, res, next) => {
  const errorFlash = req.flash('error')
  const error = errorFlash.length > 0 ? errorFlash[0] : null
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: error,
  })
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err)
      res.redirect('/reset')
    }
    const token = buffer.toString('hex')
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account exists with that email')
          return res.redirect('/reset')
        }
        user.resetToken = token
        user.resetTokenExpiration = Date.now() + 60 * 60 * 1000
        return user
          .save()
          .then((result) => {
            res.redirect('/')
            return transporter.sendMail({
              to: req.body.email,
              from: process.env.SENDER_EMAIL,
              subject: 'Reset Password',
              html: `
            <p>You requestest a password reset</p>
            <p>Reset <a href="http://localhost:3000/reset/${token}">here</a></p>
            `,
            })
          })
          .catch((err) => {
            console.log(err)
          })
      })
      .catch((err) => {
        console.log(err)
      })
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Invalid password reset link')
        return res.redirect('/reset')
      }
      const errorFlash = req.flash('error')
      const error = errorFlash.length > 0 ? errorFlash[0] : null
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'Set New Password',
        errorMessage: error,
        userId: user._id.toString(),
        token: token,
      })
    })
    .catch((err) => {
      console.log(err)
      return res.redirect('/reset')
    })
}

exports.postNewPassword = (req, res, next) => {
  const userId = req.body.userId
  const newPassword = req.body.password
  const token = req.body.token
  let resetUser

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user
      return bcrypt.hash(newPassword, 12)
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword
      resetUser.resetToken = undefined
      resetUser.resetTokenExpiration = undefined
      return resetUser.save()
    })
    .then((result) => {
      res.redirect('/login')
    })
    .catch((err) => {
      console.log(err)
    })
}
