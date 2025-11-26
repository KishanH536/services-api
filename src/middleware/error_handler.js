import { ConnectionAcquireTimeoutError } from 'sequelize'

import { error500 } from '../common/error_response.js'

/**
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} _next
 */
// Disable no unused vars because this signature must look like an express error handler
/* eslint-disable-next-line no-unused-vars */
export default (err, req, res, _next) => {
  if (err instanceof ConnectionAcquireTimeoutError) {
    req.logger.error('SequelizeConnectionAcquireTimeoutError was thrown. Shutting down.')

    process.exitCode = 1
    process.kill(process.pid, 'SIGTERM')
  }

  req.logger.error(err, 'Server error')
  error500(res)
}
