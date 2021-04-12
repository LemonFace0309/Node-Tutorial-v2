const User = require('../models/user')

exports.getLogin = (req, res, next) => {
  // const isLoggedIn =
  //   req.get('Cookie').split(';')[1].trim().split('=')[1] == true
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
  })
}

exports.postLogin = (req, res, next) => {
  // res.setHeader('Set-Cookie', 'loggedIn=true')
  User.findById('6072a792f323cc22801c8abd')
    .then((user) => {
      // req.session is an object provided by express-session. It will be
      // present in all requests
      req.session.isLoggedIn = true
      req.session.user = user
      // usually unnecessary but we added it so res.redirect('/')
      //   doesn't occur before req.session finishes sending data to the store
      req.session.save(err => {
        console.log(err)
        res.redirect('/')
      }) 
    })
    .catch((err) => console.log(err))
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/')
  })
}
