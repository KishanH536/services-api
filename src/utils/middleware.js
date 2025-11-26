import {
  error500,
} from '../common/error_response.js'

const noopMiddleware = async (_ctx, _req, _res, next) => await next()

// openapi-backend doesn't support middleware for specific handlers.
// These utilities try to mimic express.router's `app.use("/path", middleware, handler)` signature.

// For use with express-style middleware.
export const wrapMiddleware = (middleware, handler) => async (ctx, req, res) => {
  await middleware(req, res, () => handler(ctx, req, res))
}

// For use with openapi-backend operation (signature includes the `ctx` param).
export const wrapMiddlewareWithContext = (middleware, handler) => async (ctx, req, res) =>
  await middleware(ctx, req, res, () => handler(ctx, req, res))

// Supports chaining of middleware with openapi-backend signatures.
// Requires that each middleware function is async and awaits the callback.
// See `noopMiddleware` above for an example.
export const chainAsyncMiddlewareWithContext = (...fns) =>
  fns.reduce((acc, curr) => async (ctx, req, res, next) =>
    await acc(ctx, req, res, async () => {
      try {
        await curr(ctx, req, res, next)
      }
      catch (err) {
        req.logger.error(err, 'Middleware error')
        return error500(res)
      }
    }), noopMiddleware)
