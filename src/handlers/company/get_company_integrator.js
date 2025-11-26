import {
  getCompanyByIntegratorId,
} from '../../core/find_company.js'

import {
  error404,
  error500,
} from '../../common/error_response.js'

/**
 * @param {function} getCompany - The platform-style handler to get a company.
 * @returns {function} The integrator-style get handler.
 */
export default (getCompany) =>
  async (ctx, req, res) => {
    const {
      integratorId,
    } = ctx.request.params

    const {
      auth: {
        userId,
      },
      logger,
    } = req

    try {
      const company = await getCompanyByIntegratorId(
        integratorId,
        userId,
      )

      if (!company) {
        return error404(res, 'Company not found for the given integrator ID')
      }

      // Set the company in the context so it doesn't
      // need to be fetched again.
      ctx.company = company

      // Set the companyID request parameter since we're
      // delegating to the platform-style handler.
      ctx.request.params.companyId = company.id

      return await getCompany(ctx, req, res)
    }
    catch (err) {
      logger.error({ err }, 'Error getting company by integrator ID')
      return error500(res)
    }
  }
