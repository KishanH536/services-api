import prometheusClient from 'prom-client'

prometheusClient.register.setDefaultLabels({ image_source: 'motorola' })

const {
  PROMETHEUS_PORT = '1050',
  PROMETHEUS_ENDPOINT = '/metrics',
  PROMETHEUS_AI_LATENCY_BUCKETS: AI_LATENCY_BUCKETS = '0.01,0.025,0.05,0.1,0.25,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,6,7,8,9,10',
  PROMETHEUS_PROCESSING_LATENCY_BUCKETS: PROCESSING_LATENCY_BUCKETS = '0.25,0.5,1,3,6,9,12,15',
} = process.env

const prometheusPort = Number(PROMETHEUS_PORT)
const aiLatencyBuckets = AI_LATENCY_BUCKETS.split(',').map(Number)
const processingLatencyBuckets = PROCESSING_LATENCY_BUCKETS.split(',').map(Number)

export {

  prometheusPort,
  PROMETHEUS_ENDPOINT as prometheusEndpoint,
  aiLatencyBuckets,
  processingLatencyBuckets,
}

export { default as prometheusClient } from 'prom-client'
