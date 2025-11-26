export function mapOutgoingCapabilityNames(capabilityNames) {
  const outgoingCapabilityNames = []
  const processedCapabilityNames = []

  for (const capabilityName of capabilityNames) {
    processedCapabilityNames.push(capabilityName)
    if (capabilityName === 'vehicle_analytics' || capabilityName === 'vehicle_embeddings') {
      continue
    }
    if (capabilityName === 'person_analytics' || capabilityName === 'person_embeddings') {
      continue
    }
    outgoingCapabilityNames.push(capabilityName)
  }

  // Handle vehicles differently by combining vehicle_analytics and
  // vehicle_embeddings into a single API-level capability
  // vehicle_analytics.embeddings
  if (capabilityNames.includes('vehicle_analytics')) {
    if (capabilityNames.includes('vehicle_embeddings')) {
      outgoingCapabilityNames.push('vehicle_analytics.embeddings')
    }
    else {
      outgoingCapabilityNames.push('vehicle_analytics')
    }
  }

  // Same for person_analytics and person_embeddings
  if (capabilityNames.includes('person_analytics')) {
    if (capabilityNames.includes('person_embeddings')) {
      outgoingCapabilityNames.push('person_analytics.embeddings')
    }
    else {
      outgoingCapabilityNames.push('person_analytics')
    }
  }

  return outgoingCapabilityNames
}

export function mapOutgoingCapabilities(capabilities) {
  const capabilityNames = []
  for (const capability of capabilities) {
    capabilityNames.push(capability.name.toLowerCase())
  }

  return mapOutgoingCapabilityNames(capabilityNames)
}

export function mapIncomingCapabilityNames(capabilityNames) {
  const incomingCapabilityNames = []
  if (!capabilityNames) {
    return []
  }
  for (const capabilityName of capabilityNames) {
    // Convert the combined vehicle_analytics.embeddings to the two capabilities
    // vehicle_analytics and vehicle_embeddings. Check for vehicle_analytics
    // being present to cover clients sending both.
    if (capabilityName === 'vehicle_analytics.embeddings') {
      incomingCapabilityNames.push('vehicle_embeddings')
      if (!incomingCapabilityNames.includes('vehicle_analytics')) {
        incomingCapabilityNames.push('vehicle_analytics')
      }
    }
    // Same for person_analytics.embeddings
    else if (capabilityName === 'person_analytics.embeddings') {
      incomingCapabilityNames.push('person_embeddings')
      if (!incomingCapabilityNames.includes('person_analytics')) {
        incomingCapabilityNames.push('person_analytics')
      }
    }
    else {
      incomingCapabilityNames.push(capabilityName)
    }
  }

  return incomingCapabilityNames
}
