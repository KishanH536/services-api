const storeResponse = async (_req, res, next) => {
  const originalJson = res.json
  const originalStatus = res.status

  res.status = function (code) {
    res.locals.statusCode = code
    return originalStatus.call(this, code)
  }

  res.json = function (data) {
    res.locals.responseData = data
    return originalJson.call(this, data)
  }

  next()
}

export default storeResponse
