import http from 'http'

import express from 'express'
import bodyParser from 'body-parser'
import requestIp from 'request-ip'
import cors from 'cors'

import {
  CALIPSA_ENVIRONMENT,
  PORT,
} from '../config/bootstrap.js'

import {
  prometheusClient,
  prometheusPort,
  prometheusEndpoint,
} from '../config/prometheus.js'

import logger from './common/logger.js'
import attachLogger from './middleware/attach_logger.js'
import storeResponse from './middleware/store_response.js'
import errorHandler from './middleware/error_handler.js'
import handleJsonError from './middleware/json_body.js'

export async function runApi() {
  /* eslint global-require: off */
  // Need to require these after DB initialization.
  const {
    default: authenticateUserAndAttachUserId,
  } = await import('./middleware/auth/index.js')

  const {
    default: validateUser,
  } = await import('./middleware/validate_user.js')

  const {
    default: api,
  } = await import('./api/index.js')

  const app = express()

  app.use(cors({
    origin: [
      // Docs
      'https://calipsa.stoplight.io',
      'https://docs.calipsa.io',
      // Web app
      'https://elevate.pelco.com',
      'https://elevate.calipsa.biz',
      'https://elevate.calipsa.info',
      'http://localhost:8080',
      'http://localhost:8084',
      'http://localhost:8088',
    ],
  }))
  app.use(requestIp.mw())
  app.use(attachLogger)

  // app.use(bodyParser.urlencoded())
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '30mb',
  }))
  app.use(handleJsonError(
    express.json({
      limit: '30mb',
      type: ['application/json', 'application/*+json'],
    }),
  ))
  app.use(bodyParser.raw({
    type: 'image/jpeg',
    limit: '30mb',
  }))

  // Store the JSON response for any post-response processing
  app.use(storeResponse)

  // Put all routes not served by openapi-backend first because it seems like
  // openapi-backend blocks all downstream traffic.
  app.use(authenticateUserAndAttachUserId)
  app.use(validateUser)
  app.use((req, res) => api.handleRequest(req, req, res))
  app.use(errorHandler)

  // This service is not supposed to do anything else.
  app.all('*splat', (_req, res) => res.sendStatus(404))

  // Start the adapter.
  const httpServer = app.listen(PORT, () => {
    logger.info(`Real-time Services API listening at port ${PORT} for environment ${CALIPSA_ENVIRONMENT}`)
  })

  return httpServer
}

export const runPrometheus = async () => {
  // HTTP server for reporting Prometheus metrics.
  const prometheusHttpServer = http.createServer(async (req, res) => {
    const baseURL = `${req.protocol}://${req.headers.host}/`
    const reqUrl = new URL(req.url, baseURL)

    if (reqUrl.pathname === prometheusEndpoint && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': prometheusClient.register.contentType,
      })
      const metrics = await prometheusClient.register.metrics()
      res.write(metrics)
      res.end()
    }
  })

  // Start the Prometheus HTTP server.
  // Handle errors so that the module will at least fully start if there is a
  //    problem with Prometheus (for running services-api and elevate-api together)
  prometheusHttpServer.on('error', (error) => {
    logger.error(`Prometheus server failed to start - ${error.stack}`)
  })
  prometheusHttpServer.listen(prometheusPort, () => {
    logger.info(`Prometheus server listening on ${prometheusEndpoint} at port ${prometheusPort}`)
  })

  return prometheusHttpServer
}
