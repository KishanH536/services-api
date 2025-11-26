import { cloneDeep } from 'lodash-es'

import { shapePersonAnalysisResponse } from '../shape_aps_responses.js'

const persons = [{
  embedding: [1, 2, 3, 4, 5, 6],
  age_type: 'not-child',
  gender: 'male',
  hard_hat: false,
  high_vis: false,
  hair_color: [],
  clothes_upper_body_color: [
    [
      'green',
      0.6146014928817749,
    ],
  ],
  clothes_lower_body_color: [
    [
      'gray',
      0.7329350709915161,
    ],
  ],
}]
const shapedPersons = [{
  child: false,
  gender: 'male',
  wearingHardHat: false,
  highlyVisible: false,
  hairColor: [],
  clothesUpperBodyColor: [
    'green',
  ],
  clothesLowerBodyColor: [
    'gray',
  ],
}]

const detections = [{
  persons: [
    {
      box: {
        x1: 0.01698,
        y1: 0.54844,
        x2: 0.36779,
        y2: 0.93047,
      },
      face_index: 1,
      object_label: ['human', 0.94],
      attributes: persons[0],
    },
  ],
}]

const shapedFullFramePerson = {
  boundingBox: {
    x1: 0.01698,
    y1: 0.54844,
    x2: 0.36779,
    y2: 0.93047,
  },
  faceIndex: 1,
  attributes: shapedPersons[0],
}

const configuredDetections = {
  person: {},
  face: {},
}

describe('Shape person responses', () => {
  it('Should properly shape persons chip response', () => {
    const result = shapePersonAnalysisResponse({ persons })
    expect(result).toEqual(shapedPersons)
  })

  it('Should properly shape person full-frame response', () => {
    const result = shapePersonAnalysisResponse(
      { detections },
      [], // Capabilities
      configuredDetections, // Detections
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            persons: expect.arrayContaining([
              shapedFullFramePerson,
            ]),
          }),
        ],
      ),
    )
  })

  it('Should not include faceIndex if face detection not configured', () => {
    const result = shapePersonAnalysisResponse(
      { detections },
      [], // Capabilities
      { person: {} }, // Detections
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            persons: expect.arrayContaining([
              expect.objectContaining({
                faceIndex: undefined,
              }),
            ]),
          }),
        ],
      ),
    )
  })
})

// Create tests with missing response arrays
const personsMissingArrays = cloneDeep(persons)
delete personsMissingArrays[0].hair_color
delete personsMissingArrays[0].clothes_upper_body_color
delete personsMissingArrays[0].clothes_lower_body_color
const shapedPersonsMissingArrays = cloneDeep(shapedPersons)
shapedPersonsMissingArrays[0].hairColor = []
shapedPersonsMissingArrays[0].clothesUpperBodyColor = []
shapedPersonsMissingArrays[0].clothesLowerBodyColor = []

const detectionsMissingArrays = [{
  persons: [
    {
      box: {
        x1: 0.01698,
        y1: 0.54844,
        x2: 0.36779,
        y2: 0.93047,
      },
      object_label: ['human', 0.94],
      attributes: personsMissingArrays[0],
    },
  ],
}]

const shapedFullFramePersonMissingArrays = {
  boundingBox: {
    x1: 0.01698,
    y1: 0.54844,
    x2: 0.36779,
    y2: 0.93047,
  },
  attributes: shapedPersonsMissingArrays[0],
}

describe('Shape person responses missing arrays', () => {
  it('Should properly shape persons chip response with missing attribute arrays', () => {
    const result = shapePersonAnalysisResponse(
      { persons: personsMissingArrays },
      [],
    )
    expect(result).toEqual(shapedPersonsMissingArrays)
  })

  it('Should properly shape person full-frame response with missing attribute arrays', () => {
    const result = shapePersonAnalysisResponse(
      { detections: detectionsMissingArrays },
      [],
    )
    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining({
            persons: expect.arrayContaining([
              shapedFullFramePersonMissingArrays,
            ]),
          }),
        ],
      ),
    )
  })
})
