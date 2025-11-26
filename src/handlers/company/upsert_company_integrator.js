import {
  getCompanyByIntegratorId,
} from '../../core/find_company.js'

import {
  error500,
} from '../../common/error_response.js'

/**
 * @param {function} createCompany - The platform-style handler to create a company.
 * @param {function} updateCompany - The platform-style handler to update a company.
 *
 * @return {function} The integrator-style upsert handler.
 */
export default (createCompany, updateCompany) =>
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

      if (company) {
        ctx.request.params.companyId = company.id
        ctx.company = company
        return await updateCompany(ctx, req, res)
      }
      return await createCompany(ctx, req, res)
    }
    catch (err) {
      logger.error({ err }, 'Error processing company upsert')
      return error500(res)
    }
  }
