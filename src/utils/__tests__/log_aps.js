import { jest } from '@jest/globals'

import {
  logApsResponse,
} from '../log_aps.js'

const log = {
  debug: jest.fn(),
}

describe('Hide embeddings from logs for parallel analytics result response formats', () => {
  beforeEach(() => {
    log.debug.mockClear()
  })

  it('should hide embeddings from logs', () => {
    const resultWithEmbeddings = {
      analytics: {
        'face-analysis': {
          faces: [
            [
              {
                embedding: [1, 2, 3],
                quality: 1,
              },
            ],
          ],
          isValid: true,
        },
      },
    }

    logApsResponse(log, resultWithEmbeddings)

    expect(log.debug.mock.calls[0][0]).toEqual({
      analytics: {
        'face-analysis': {
          faces: [
            [
              {
                embeddingLength: 3,
                quality: 1,
              },
            ],
          ],
          isValid: true,
        },
      },
    })
  })

  it('should handle empty face results', () => {
    const resultWithMissingFaces = {
      analytics: {
        'face-analysis': {
          faces: [[]],
          isValid: true,
        },
      },
    }

    logApsResponse(log, resultWithMissingFaces)

    expect(log.debug.mock.calls[0][0]).toEqual({
      analytics: {
        'face-analysis': {
          faces: [[]],
          isValid: true,
        },
      },
    })
  })

  it('should include other properties', () => {
    const nonFaceResult = {
      analytics: {
        'face-analysis': {
          isValid: true,
          otherFaceProp: 'value',
        },
        'other-analytic': {
          isValid: true,
        },
      },
      otherProp: 'value',
    }

    logApsResponse(log, nonFaceResult)

    expect(log.debug.mock.calls[0][0]).toEqual({
      analytics: {
        'face-analysis': {
          isValid: true,
          otherFaceProp: 'value',
        },
        'other-analytic': {
          isValid: true,
        },
      },
      otherProp: 'value',
    })
  })
})
