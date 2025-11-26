import {
  objectInArrayContainsAttribute as detectionsContainsAttribute,
} from '../utils/array_object_structure.js'

// The ML results of vehicles and persons is to have, for each attribute, an array
// containing the result, and a confidence (e.g., ["blue", 0.9]). In some cases, as is the
// case with LPR results, this is a 3-tuple confidence (e.g., ["blue", 0.9, "high"]).
// These shapers just pull the relevate elements in each attribute array (value is first,
// confidence is second, OCR quality rating is third)
//
// Since the ML results can come back empty if the confidence is below a
// threshold, there needs to be a null check before applying the index.
//
const getAttributeValue = confidenceTuple =>
  confidenceTuple ? confidenceTuple[0] : null

// the spec is a number between 0 and 1, inclusive
const getAttributeScore = confidenceTuple =>
  confidenceTuple?.length > 1
  && confidenceTuple[1] >= 0
  && confidenceTuple[1] <= 1
    ? confidenceTuple[1]
    : undefined

// the spec is an enum for these values
const expectedOcrQualityValues = new Set(['low', 'medium', 'high'])

const getAttributeOcrQuality = confidenceTuple =>
  confidenceTuple?.length > 2
  && expectedOcrQualityValues.has(confidenceTuple[2])
    ? confidenceTuple[2]
    : undefined

const shapeVehicle = (vehicle, includeEmbeddings) => ({
  vehicleType: getAttributeValue(vehicle.vehicle_type),
  makeModel: vehicle.make || vehicle.model
    ? `${getAttributeValue(vehicle.make)}, ${getAttributeValue(vehicle.model)}`
    : getAttributeValue(vehicle.make_model),
  // colour is an array, since vehicles can be multi-colored
  color: vehicle.colour ? vehicle.colour.map(getAttributeValue) : [],
  embedding: includeEmbeddings ? vehicle.embedding : undefined,
})

const shapePlate = plate => ({
  quality: getAttributeValue(plate.quality),
  text: getAttributeValue(plate.text),
  ranking: getAttributeScore(plate.text),
  rating: getAttributeOcrQuality(plate.text),
  state: getAttributeValue(plate.state),
})

const shapeDetectionPlate = plate => {
  const shapedPlate = {
    boundingBox: plate.box,
    attributes: shapePlate(plate.attributes),
  }
  if (plate.vehicle_index >= 0) {
    shapedPlate.vehicleId = plate.vehicle_index
  }
  else if (plate.vehicle_id >= 0) {
    shapedPlate.vehicleId = plate.vehicle_id
  }
  return shapedPlate
}

const shapeDetectionVehicle = (vehicle, includeEmbeddings) => ({
  boundingBox: vehicle.box,
  objectLabel: getAttributeValue(vehicle.object_label),
  attributes: shapeVehicle(vehicle.attributes, includeEmbeddings),
})

const shapeVehicles = (vehicles, includeEmbeddings) => {
  const shapedVehicles = []
  for (const vehicle of vehicles) {
    const shapedVehicle = shapeVehicle(vehicle, includeEmbeddings)
    shapedVehicles.push(shapedVehicle)
  }
  return shapedVehicles
}

const shapePlates = plates => plates.map(shapePlate)

// Skip over any detections that are not vehicles or plates
const shapeVehicleDetections = (detections, includeEmbeddings) => {
  const retArray = []
  for (const detection of detections) {
    if (detection.vehicles && detection.plates) {
      retArray.push({
        vehicles: detection.vehicles.map(
          vehicle => shapeDetectionVehicle(
            vehicle,
            includeEmbeddings,
          ),
        ),
        plates: detection.plates.map(shapeDetectionPlate),
      })
    }
    else if (detection.vehicles) {
      retArray.push({
        vehicles: detection.vehicles.map(
          vehicle => shapeDetectionVehicle(
            vehicle,
            includeEmbeddings,
          ),
        ),
      })
    }
    else if (detection.plates) {
      retArray.push({
        plates: detection.plates.map(shapeDetectionPlate),
      })
    }
  }
  return retArray
}

export const shapeVehicleAnalysisResponse = (
  {
    plates,
    vehicles,
    detections,
  },
  companyCapabilities,
) => {
  let vehicleAnalytics = {}
  const includeEmbeddings = companyCapabilities.includes('vehicle_embeddings')

  // Can only be one of the following for vehicle results
  if (plates) {
    vehicleAnalytics.plates = shapePlates(plates)
  }
  else if (vehicles) {
    // Add Vehicle Analysis for chips processing if it is returned
    vehicleAnalytics.vehicles = shapeVehicles(vehicles, includeEmbeddings)
  }
  else if (detectionsContainsAttribute(detections, 'vehicles') || detectionsContainsAttribute(detections, 'plates')) {
    vehicleAnalytics = shapeVehicleDetections(detections, includeEmbeddings)
  }

  return vehicleAnalytics
}

// For age, we convert the returned ML value into a boolean, but first we need
// to check to see if the returned value is an array, and extract the value
// before doing the conversion.
const getAge = age => {
  const ageValue = Array.isArray(age) ? getAttributeValue(age) : age
  return ageValue ? ageValue !== 'not-child' : null
}

const shapePerson = (includeEmbeddings) => person => ({
  child: getAge(person.age_type),
  gender: Array.isArray(person.gender)
    ? getAttributeValue(person.gender)
    : person.gender,
  wearingHardHat: person.hard_hat,
  highlyVisible: person.high_vis,
  hairColor: person.hair_color ? person.hair_color.map(getAttributeValue) : [],
  clothesUpperBodyColor: person.clothes_upper_body_color
    ? person.clothes_upper_body_color.map(getAttributeValue)
    : [],
  clothesLowerBodyColor: person.clothes_lower_body_color
    ? person.clothes_lower_body_color.map(getAttributeValue)
    : [],
  embedding: includeEmbeddings ? person.embedding : undefined,
})

const shapePersons = (
  persons,
  includeEmbeddings,
) => persons.map(
  shapePerson(includeEmbeddings),
)

const shapePersonDetections = (
  detections,
  includeEmbeddings,
  includeFaces,
) => {
  const retArray = []
  const shaper = shapePerson(includeEmbeddings)

  for (const detection of detections) {
    if (detection.persons) {
      retArray.push({
        persons: detection.persons.map(
          person => ({
            boundingBox: person.box,
            faceIndex: includeFaces
              ? person.face_index
              : undefined,
            attributes: person.attributes
              ? shaper(person.attributes)
              : {},
          }),
        ),
      })
    }
  }
  return retArray
}

export const shapePersonAnalysisResponse = (
  {
    persons,
    detections,
  },
  companyCapabilities,
  configuredDetections,
) => {
  let personAnalytics = {}
  const includeEmbeddings = companyCapabilities?.includes('person_embeddings')
  const includeFaces = configuredDetections?.face

  if (persons) {
    personAnalytics = shapePersons(persons, includeEmbeddings)
  }
  else if (detectionsContainsAttribute(detections, 'persons')) {
    personAnalytics = shapePersonDetections(
      detections,
      includeEmbeddings,
      Boolean(includeFaces),
    )
  }

  return personAnalytics
}

const shapeClassificationDetections = detections => {
  const retArray = []
  for (const detection of detections) {
    if (detection.objectLabel) {
      retArray.push({
        objectLabels: detection.objectLabel.map(label => label[0]),
      })
    }
  }
  return retArray
}

export const shapeClassificationAnalysisResponse = ({
  detections,
}) => {
  let classificationAnalytics = {}

  if (detectionsContainsAttribute(detections, 'objectLabel')) {
    classificationAnalytics = shapeClassificationDetections(detections)
  }

  return classificationAnalytics
}

const toDetectionResult = ({ valid, error }) => {
  if (error || valid === undefined) {
    return 'not_performed'
  }
  return valid ? 'valid' : 'not_valid'
}

export const shapeMultipleRisk = ({
  valid,
  securityRisks = {},
  environmentalHazards = {},
}) => ({
  riskDetected: toDetectionResult({ valid }),
  securityRisks: {
    risk: toDetectionResult(securityRisks),
    description: securityRisks.description,
    categories: securityRisks.categories,
  },
  environmentalHazards: {
    hazard: toDetectionResult(environmentalHazards),
    description: environmentalHazards.description,
    categories: environmentalHazards.categories,
  },
})
