import httpMocks from 'node-mocks-http'

import useMiddleware from './middleware.js'

export default (reqOptions = {}) => {
  const ctx = {
    request: {
      headers: {},
      params: {},
      query: {},
      body: {},
    },
    api: {
      apiRoot: '',
    },
  }

  const request = httpMocks.createRequest(reqOptions)
  const response = httpMocks.createResponse()

  useMiddleware(request, response)

  return {
    ctx,
    request,
    response,
  }
}
