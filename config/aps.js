const APS_HOST = process.env.APS_HOST || 'alarm-processor'
const APS_PORT = process.env.APS_PORT || '8080'

const APS_TIMEOUT = process.env.AI_TIMEOUT ? Number.parseInt(process.env.AI_TIMEOUT, 10) : 8000

const NO_OF_APS_ATTEMPTS = process.env.NO_OF_AI_ATTEMPTS ? Number(process.env.NO_OF_AI_ATTEMPTS) : 2

const APS_RETRY_DELAY = process.env.APS_RETRY_DELAY
  ? Number.parseInt(process.env.APS_RETRY_DELAY, 10)
  : 1000

export {
  APS_HOST,
  APS_PORT,
  APS_TIMEOUT,
  NO_OF_APS_ATTEMPTS,
  APS_RETRY_DELAY,
}
