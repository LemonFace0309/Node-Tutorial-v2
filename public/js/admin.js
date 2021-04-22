const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector('[name=productId]').value
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value

  const productElement = btn.closest('article')

  fetch('/admin/product/' + productId, {
    method: 'DELETE',
    // csrf also looks into query parameters and
    //   request headers for csrf tokens. Not just the
    //   request body.
    headers: {
      'csrf-token': csrf,
    },
  })
    .then((result) => {
      return result.json
    })
    .then(data => {
      console.log(data)
      productElement.remove() // not supported on IE
      // productElement.parentNode.removeChild(productElement) // for IE
    })
    .catch((err) => {
      console.log(err)
    })
}
