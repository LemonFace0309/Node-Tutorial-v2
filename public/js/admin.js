const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector('[name=productId]').value
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value

  fetch('/admin/product/' + productId, {
    method: 'DELETE',
    // csruf also looks into query parameters and
    //   request headers for csrf tokens. Not just the
    //   request body.
    headers: {
      'csrf-token': csrf,
    },
  })
    .then((result) => {
      console.log(result)
    })
    .catch((err) => {
      console.log(err)
    })
}
