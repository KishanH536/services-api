import { cloneDeep } from 'lodash-es'

import { shapeVehicleAnalysisResponse } from '../shape_aps_responses.js'

const plates = [{
  quality: ['readable', 1],
  text: ['2U4355', 0.73, 'high'],
  state: ['SD', 1],
}]
const shapedPlates = [{
  quality: 'readable',
  text: '2U4355',
  state: 'SD',
  ranking: 0.73,
  rating: 'high',
}]

const vehicles = [{
  vehicle_type: ['sedan', 0.6],
  colour: [['black', 0.96], ['silver', 0.46]],
  make_model: ['toyota_rav4', 0.88],
  embedding: [1, 2, 3],
}]
const chipVehicles = [{
  vehicle_type: ['sedan', 0.6],
  colour: [['black', 0.96], ['silver', 0.46]],
  make_model: ['toyota_rav4', 0.88],
  embedding: [1, 2, 3],
}]
const newVehicles = [{
  vehicle_type: ['sedan', 0.6],
  colour: [['black', 0.96], ['silver', 0.46]],
  make: ['toyota', 0.88],
  model: ['rav4', 0.88],
}]
const shapedVehicles = [{
  vehicleType: 'sedan',
  color: [
    'black',
    'silver',
  ],
  makeModel: 'toyota_rav4',
}]
const newShapedVehicles = [{
  vehicleType: 'sedan',
  color: [
    'black',
    'silver',
  ],
  makeModel: 'toyota, rav4',
}]

const detections = [{
  vehicles: [
    {
      box: {
        x1: 0.01698,
        y1: 0.54844,
        x2: 0.36779,
        y2: 0.93047,
      },
      object_label: ['car', 0.94],
      attributes: vehicles[0],
    },
  ],
  plates: [
    {
      box: {
        x1: 0.07858,
        y1: 0.69219,
        x2: 0.13717,
        y2: 0.75,
      },
      object_label: ['plate', 0.84],
      attributes: plates[0],
      vehicle_id: 0,
    },
  ],
}]

// create permutations of ML responses
const noVehicleIdDetections = cloneDeep(detections)
noVehicleIdDetections[0].plates[0].vehicle_id = -1
const newVehicleDetections = cloneDeep(detections)
newVehicleDetections[0].vehicles[0].attributes = newVehicles[0]
const vehicleIndexDetections = cloneDeep(detections)
delete vehicleIndexDetections[0].plates[0].vehicle_id
vehicleIndexDetections[0].plates[0].vehicle_index = 0

const shapedFullFrameVehicle = {
  boundingBox: {
    x1: 0.01698,
    y1: 0.54844,
    x2: 0.36779,
    y2: 0.93047,
  },
  objectLabel: 'car',
  attributes: shapedVehicles[0],
}
const shapedFullFrameVehicleEmbedding = {
  ...shapedFullFrameVehicle,
  attributes: {
    ...shapedFullFrameVehicle.attributes,
    embedding: [1, 2, 3],
  },
}
const shapedFullFramePlate = {
  boundingBox: {
    x1: 0.07858,
    y1: 0.69219,
    x2: 0.13717,
    y2: 0.75,
  },
  attributes: shapedPlates[0],
  vehicleId: 0,
}
const shapedNoVehicleIdPlate = {
  boundingBox: {
    x1: 0.07858,
    y1: 0.69219,
    x2: 0.13717,
    y2: 0.75,
  },
  attributes: shapedPlates[0],
}
const shapedNewFullFrameVehicles = {
  boundingBox: {
    x1: 0.01698,
    y1: 0.54844,
    x2: 0.36779,
    y2: 0.93047,
  },
  objectLabel: 'car',
  attributes: newShapedVehicles[0],
}

describe('Shape vehicle responses', () => {
  it('Should properly shape plate chip response', () => {
    const result = shapeVehicleAnalysisResponse(
      { plates },
      [], // capabilities
    )
    expect(result.plates).toEqual(shapedPlates)
  })

  it('Should properly shape vehicle chip response no embeddings', () => {
    const result = shapeVehicleAnalysisResponse(
      {
        vehicles,
      },
      [], // companyCapabilities
    )
    expect(result.vehicles).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicleType: expect.any(String),
            makeModel: expect.any(String),
            color: expect.any(Array),
          }),
        ],
      ),
    )
  })

  it('Should properly shape vehicle chip response with embeddings', () => {
    const result = shapeVehicleAnalysisResponse(
      {
        vehicles: chipVehicles,
      },
      ['vehicle_embeddings'], // companyCapabilities
    )
    expect(result.vehicles).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicleType: expect.any(String),
            makeModel: expect.any(String),
            color: expect.any(Array),
            embedding: expect.any(Array),
          }),
        ],
      ),
    )
  })

  it('Should properly shape vehicle full-frame response', () => {
    const result = shapeVehicleAnalysisResponse(
      { detections },
      [], // companyCapabilities
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicles: expect.arrayContaining([
              shapedFullFrameVehicle,
            ]),
          }),
          expect.objectContaining({
            plates: expect.arrayContaining([
              shapedFullFramePlate,
            ]),
          }),
        ],
      ),
    )
  })

  it('Should properly shape vehicle full-frame response with embeddings', () => {
    const result = shapeVehicleAnalysisResponse(
      { detections },
      ['vehicle_embeddings'], // companyCapabilities
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicles: expect.arrayContaining([
              shapedFullFrameVehicleEmbedding,
            ]),
          }),
          expect.objectContaining({
            plates: expect.arrayContaining([
              shapedFullFramePlate,
            ]),
          }),
        ],
      ),
    )

    expect(result[0].vehicles[0].attributes).toHaveProperty('embedding')
  })

  it('Should properly shape new vehicle full-frame response', () => {
    const result = shapeVehicleAnalysisResponse(
      { detections: newVehicleDetections },
      [], // companyCapabilities
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicles: expect.arrayContaining([
              shapedNewFullFrameVehicles,
            ]),
          }),
          expect.objectContaining({
            plates: expect.arrayContaining([
              shapedFullFramePlate,
            ]),
          }),
        ],
      ),
    )
  })

  it('Should properly shape vehicle full-frame response with vehicle_index instead of vehicle_id', () => {
    const result = shapeVehicleAnalysisResponse(
      { detections: vehicleIndexDetections },
      [], // companyCapabilities
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicles: expect.arrayContaining([
              shapedFullFrameVehicle,
            ]),
          }),
          expect.objectContaining({
            plates: expect.arrayContaining([
              shapedFullFramePlate,
            ]),
          }),
        ],
      ),
    )
  })

  it('Should properly shape vehicle full-frame response with no plate vehicle_id', () => {
    const result = shapeVehicleAnalysisResponse(
      { detections: noVehicleIdDetections },
      [], // companyCapabilities
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicles: expect.arrayContaining([
              shapedFullFrameVehicle,
            ]),
          }),
          expect.objectContaining({
            plates: expect.arrayContaining([
              shapedNoVehicleIdPlate,
            ]),
          }),
        ],
      ),
    )
  })
})

// Shape vehicles and plates with missing attributes

const platesMissingArrays = [{
  quality: ['readable', 1],
  state: ['SD', 1],
}]
const shapedPlatesMissingArrays = [{
  quality: 'readable',
  text: null,
  state: 'SD',
}]

const vehiclesMissingArrays = [{
  vehicle_type: ['sedan', 0.6],
}]
const newVehiclesMissingArrays = [{
  vehicle_type: ['sedan', 0.6],
  colour: [['black', 0.96], ['silver', 0.46]],
}]
const shapedVehiclesMissingArrays = [{
  vehicleType: 'sedan',
  color: [],
  makeModel: null,
}]
const newShapedVehiclesMissingArrays = [{
  vehicleType: 'sedan',
  color: [
    'black',
    'silver',
  ],
  makeModel: null,
}]

const detectionsMissingObjectLabel = [{
  vehicles: [
    {
      box: {
        x1: 0.01698,
        y1: 0.54844,
        x2: 0.36779,
        y2: 0.93047,
      },
      attributes: vehiclesMissingArrays[0],
    },
  ],
  plates: [
    {
      box: {
        x1: 0.07858,
        y1: 0.69219,
        x2: 0.13717,
        y2: 0.75,
      },
      attributes: platesMissingArrays[0],
      vehicle_id: 0,
    },
  ],
}]

const shapedFullFrameVehicleNullObjectLabel = {
  boundingBox: {
    x1: 0.01698,
    y1: 0.54844,
    x2: 0.36779,
    y2: 0.93047,
  },
  objectLabel: null,
  attributes: shapedVehiclesMissingArrays[0],
}

describe('Shape vehicle responses with missing attributes', () => {
  it('Should properly shape plate chip response with missing attributes', () => {
    const result = shapeVehicleAnalysisResponse(
      { plates: platesMissingArrays },
      [], // capabilities
    )
    expect(result).toEqual({ plates: shapedPlatesMissingArrays })
  })

  it('Should properly shape vehicle chip response with missing attributes', () => {
    const result = shapeVehicleAnalysisResponse(
      {
        vehicles: vehiclesMissingArrays,
      },
      [], // companyCapabilities
    )
    expect(result).toEqual({ vehicles: shapedVehiclesMissingArrays })
  })

  it('Should properly shape new vehicle chip response with missing attributes', () => {
    const result = shapeVehicleAnalysisResponse(
      {
        vehicles: newVehiclesMissingArrays,
      },
      [], // companyCapabilities
    )
    expect(result).toEqual({ vehicles: newShapedVehiclesMissingArrays })
  })

  it('Should properly shape vehicle full-frame response with missing attributes', () => {
    const result = shapeVehicleAnalysisResponse(
      { detections: detectionsMissingObjectLabel },
      [], // companyCapabilities
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            vehicles: expect.arrayContaining([
              shapedFullFrameVehicleNullObjectLabel,
            ]),
          }),
        ],
      ),
    )
  })
})
