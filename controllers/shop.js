const fs = require('fs')
const path = require('path')

const PDFDocument = require('pdfkit')

const Product = require('../models/product')
const Order = require('../models/order')

const ITEMS_PER_PAGE = 1

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId') // does not return a promise
    .execPopulate() // returns a promise
    .then((user) => {
      const products = user.cart.items
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product)
    })
    .then((result) => {
      console.log(result)
      res.redirect('/cart')
    })
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect('/cart')
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId') // does not return a promise
    .execPopulate() // returns a promise
    .then((user) => {
      const products = user.cart.items.map((product) => {
        // ._doc provides only the central data
        return {
          quantity: product.quantity,
          productData: { ...product.productId._doc },
        }
      })
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
      })
      return order.save()
    })
    .then((result) => {
      return req.user.clearCart()
    })
    .then((result) => {
      res.redirect('/orders')
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    })
}

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error('No order found!'))
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized access'))
      }
      const invoiceName = 'invoice-' + orderId + '.pdf'
      const invoicePath = path.join('data', 'invoices', invoiceName)

      const pdfDoc = new PDFDocument()
      // writes pdf onto server
      pdfDoc.pipe(fs.createWriteStream(invoicePath))
      // pipe readable stream into writable stream (res is a writeable stream)
      pdfDoc.pipe(res)

      pdfDoc.fontSize(26).text('Invoice', {
        bold: true,
        underline: true,
      })
      pdfDoc.text('------------------')
      pdfDoc.fontSize(14)
      let sum = 0
      order.products.forEach((prod) => {
        sum += prod.productData.price * prod.quantity
        pdfDoc.text(
          prod.productData.title +
            ' - ' +
            prod.quantity +
            ' x ' +
            '$' +
            prod.productData.price
        )
      })
      pdfDoc.text('---')
      pdfDoc.fontSize(20).text('Total Price: $' + sum)

      pdfDoc.end()

      // READING FILES IS EXTREMELY INEFFICIENT
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err)
      //   }
      //   res.setHeader('Content-Type', 'application/pdf')
      //   // can also use 'Content-Disposition', 'attachment;...'
      //   res.setHeader(
      //     'Content-Disposition',
      //     `inline; filename="${invoiceName}"`
      //   )
      //   res.send(data)
      // })

      // PIPING FILES TO USER
      // const file = fs.createReadStream(invoicePath)
      // file.pipe(res)
    })
    .catch((err) => {
      return next(err)
    })
}
