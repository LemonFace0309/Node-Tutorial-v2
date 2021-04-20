const mongoose = require('mongoose')
const { validationResult } = require('express-validator')

const fileHelper = require('../util/file')
const Product = require('../models/product')

exports.getAddProduct = (req, res, next) => {
  // if (!req.session.isLoggedIn) {
  //   return res.redirect('/login')
  // }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  })
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title
  const image = req.file
  const price = req.body.price
  const description = req.body.description
  console.log(image)

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: 'Attached file is not an iamge.',
      validationErrors: [],
    })
  }

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    })
  }

  const imageUrl = image.path

  const product = new Product({
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId: req.user._id, //_id not required, mongosse can store the user id with just req.user
  })
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log('Created Product')
      res.redirect('/admin/products')
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit
  if (!editMode) {
    return res.redirect('/')
  }
  const prodId = req.params.productId
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect('/')
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId
  const updatedTitle = req.body.title
  const updatedPrice = req.body.price
  const image = req.file
  const updatedDesc = req.body.description

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    })
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/')
      }
      product.title = updatedTitle
      product.price = updatedPrice
      if (image) {
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl = image.path
      }
      product.description = updatedDesc
      return product.save().then((result) => {
        console.log('UPDATED PRODUCT!')
        res.redirect('/admin/products')
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    //.populate('userId') provides the full user object instead of just the user ID
    // .select('title price -_id') only provides the selected fields with id explicitly excluded
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found'))
      }
      fileHelper.deleteFile(product.imageUrl)
      return Product.deleteOne({ _id: prodId, userId: req.user._id })
    })
    .then(() => {
      res.redirect('/admin/products')
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}
