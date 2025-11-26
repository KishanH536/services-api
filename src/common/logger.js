import pino from 'pino'

const logger = pino({ level: 'debug' })

export default logger.child({ name: 'services-api' })
