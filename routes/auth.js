const express = require('express')
const { check, body } = require('express-validator')

const authController = require('../controllers/auth')
const User = require('../models/user')

const router = express.Router()

router.get('/login', authController.getLogin)

router.get('/signup', authController.getSignup)

router.post(
  '/login',
  [
    body('email', 'Please use a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be valid').isLength({ min: 5 }).trim(),
  ],
  authController.postLogin
)

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      // custom validator accepts a boolean, throws an error, or accepts a promise
      .custom((value, { req }) => {
        // if (value === 'test@test.com') {
        //   throw new Error('This email address is forbidden')
        // }
        // return true
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject('Email already exists')
          }
          // if promise is not rejected, validation is treated as successful
        })
      })
      .normalizeEmail(),
    body('password', 'Please ensure your password is at least 5 letters long')
      // .isAlphanumeric()
      .isLength({ min: 5 })
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Please ensure your passwords match')
        }
        return true
      }),
  ],
  authController.postSignup
)

router.post('/logout', authController.postLogout)

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

router.get('/reset/:token', authController.getNewPassword)

router.post('/new-password', authController.postNewPassword)

module.exports = router
