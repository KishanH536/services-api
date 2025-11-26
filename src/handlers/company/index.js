import {
  mimes,
} from '../../constants/index.js'

import {
  error401,
  error403,
  error404,
  error500,
} from '../../common/error_response.js'

import {
  NotFoundError,
  AuthorizationError,
  AuthenticationError,
} from '../../common/errors/index.js'

import create from './create_company.js'
import read from './get_company.js'
import readOwn from './get_own_company.js'
import update from './update_company.js'
import patch from './patch_own_company.js'
import del from './delete_company.js'
import readAll from './get_companies.js'

import getUpsertCompanyHandler from './upsert_company_integrator.js'
import getGetCompanyHandler from './get_company_integrator.js'

const handlersSucceed = (...handlers) => async (...handlerArgs) => {
  /* eslint no-await-in-loop: off */
  // Want to check each handler synchronously
  for (const handler of handlers) {
    await handler(...handlerArgs)
  }
}

/**
 * @callback RequestHandler
 * @param {Object} ctx - The context object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */

/**
 * @typedef {Object} HandlerParts
 * @property {Function} performOperation - The operation to perform.
 * @property {Array<Function>} checks - The checks to perform before the operation.
 */

/**
 * Builds a request handler.
 *
 * @param {HandlerParts} handlerParts - The parts of the handler.
 * @returns {RequestHandler} The built request handler.
 */
const buildHandler = ({ checks, performOperation }) => {
  const checkPreConditions = handlersSucceed(
    ...checks,
  )

  return async (ctx, req, res) => {
    res.type(mimes.jsonApi)
    try {
      // PreConditions throw on failure.
      await checkPreConditions(ctx, req, res)

      await performOperation(ctx, req, res)
    }
    catch (err) {
      if (err instanceof NotFoundError) {
        return error404(res, err.message)
      }
      if (err instanceof AuthorizationError) {
        return error403(res)
      }
      if (err instanceof AuthenticationError) {
        // Shouldn't ever get this type, so log it.
        req.logger.error('Caught authentication error in company precondition handlers')
        return error401(res)
      }

      // Else log the error and return 500
      req.logger.error(err)
      if (!res.headersSent) {
        error500(res)
      }
    }
  }
}

export const createCompany = buildHandler(create)
export const getCompany = buildHandler(read)
export const getOwnCompany = buildHandler(readOwn)
export const updateCompany = buildHandler(update)
export const patchOwnCompany = buildHandler(patch)
export const deleteCompany = buildHandler(del)
export const getCompanies = buildHandler(readAll)

export const upsertCompanyIntegrator = getUpsertCompanyHandler(
  createCompany,
  updateCompany,
)

export const getCompanyIntegrator = getGetCompanyHandler(
  getCompany,
)
