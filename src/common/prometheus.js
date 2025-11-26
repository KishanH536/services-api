import {
  prometheusClient,
  aiLatencyBuckets,
  processingLatencyBuckets,
} from '../../config/prometheus.js'

export const dbErrorCounter = new prometheusClient.Counter({
  name: 'db_error_count',
  help: 'Total DB errors',
})

export const imagesCounter = new prometheusClient.Counter({
  name: 'items_need_ai_process_total',
  help: 'For how many images send to AI process',
})

export const analysisDurationSeconds = new prometheusClient.Histogram({
  name: 'ai_processing_duration_sec',
  help: 'How long AI return processed image',
  buckets: aiLatencyBuckets,
})

export const incomingAlarmsCount = new prometheusClient.Counter({
  name: 'total_incoming_alarms_motorola',
  help: 'Total Incoming Alarms To motorola',
})

export const serverErrors = new prometheusClient.Counter({
  name: 'server_errors_motorola',
  help: 'Server Errors On motorola Adapter',
})

export const totalAIFailures = new prometheusClient.Counter({
  name: 'total_ai_failures',
  help: 'Total AI Failures Encountered',
})

export const totalProcessingErrors = new prometheusClient.Counter({
  name: 'total_processing_errors_motorola',
  help: 'Total Processing Errors On motorola Adapter',
})

export const totalPostProcessingErrors = new prometheusClient.Counter({
  name: 'total_post_processing_errors_motorola',
  help: 'Total Post-Processing Errors On motorola Adapter',
})

export const alarmProcessingTime = new prometheusClient.Histogram({
  name: 'alarm_processing_time_motorola',
  help: 'The time in seconds it took to process & send an alarm back to the customer',
  buckets: processingLatencyBuckets,
})
