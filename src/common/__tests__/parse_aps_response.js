import {
  parseAnalysisResponse,
  parseChipResponse,
} from '../parse_aps_response.js'

const sampleTampering = {
  isPerformed: false,
  reason: {
    notEligible: {},
  },
}

const samplePersonsDetections = [{
  persons: [{
    box: [0, 0, 0, 0],
    attributes: {
      wearingHardHat: true,
    },
  }],
}]

const sampleVehiclesDetections = [{
  vehicles: [{
    box: [0, 0, 0, 0],
    attributes: {
      vehicleType: 'car',
    },
  }],
}]

const sampleClassificationDetections = [{
  objectLabel: 'test',
}]

const sampleAnalysisResponse = {
  tampering: sampleTampering,
  analytics: {
    'person-analysis': {
      isValid: 'True',
      detections: samplePersonsDetections,
    },
    'vehicle-analysis': {
      isValid: 'True',
      detections: sampleVehiclesDetections,
    },
    'scene-classification': {
      isValid: 'True',
      detections: sampleClassificationDetections,
    },
  },
}

const sampleChipResponse = {
  analytics: {
    'gun-chips': {
      isValid: 'True',
    },
    'face-chips': {
      isValid: 'True',
    },
    'lpr-chips': {
      isValid: 'True',
    },
    'vehicle-chips': {
      isValid: 'True',
    },
    'person-chips': {
      isValid: 'True',
    },
  },
}

describe('Parse analysis response', () => {
  it('Should parse a parallel detection analysis response', () => {
    const result = parseAnalysisResponse(sampleAnalysisResponse)

    expect(result.tampering).toBe(sampleTampering)
    expect(result.analytics).toEqual({
      person: {
        valid: true,
        detections: samplePersonsDetections,
      },
      vehicle: {
        valid: true,
        detections: sampleVehiclesDetections,
      },
      sceneClassification: {
        valid: true,
        detections: sampleClassificationDetections,
      },
    })
  })

  it('Should infer the overall result validity from the analytics', () => {
    const result = parseAnalysisResponse({
      tampering: sampleTampering,
      analytics: {
        'person-analysis': {
          isValid: 'False',
        },
        'vehicle-analysis': {
          isValid: 'True',
        },
      },
    })

    expect(result).toEqual({
      valid: true, // if any of the analytics is valid, the overall result is valid
      tampering: sampleTampering,
      analytics: {
        person: {
          valid: false,
        },
        vehicle: {
          valid: true,
        },
      },
    })
  })
})

describe('Parse chip response', () => {
  it('Should parse a chip response', () => {
    const result = parseChipResponse(sampleChipResponse)

    expect(result.analytics).toEqual({
      gun: {
        valid: true,
      },
      face: {
        valid: true,
      },
      lpr: {
        valid: true,
      },
      vehicleChips: {
        valid: true,
      },
      personChips: {
        valid: true,
      },
    })
  })

  it('Should infer the overall result validity from the analytics', () => {
    const result = parseChipResponse({
      analytics: {
        'gun-chips': {
          isValid: 'False',
        },
        'face-chips': {
          isValid: 'True',
        },
      },
    })

    expect(result).toEqual({
      valid: true, // if any of the chips is valid, the overall result is valid
      analytics: {
        gun: {
          valid: false,
        },
        face: {
          valid: true,
        },
      },
    })
  })
})
