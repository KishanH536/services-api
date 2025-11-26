import { jest } from '@jest/globals'
import httpMocks from 'node-mocks-http'

import {
  parseAlarmOptions,
  parseChipOptions,
} from '../middleware/normalize_options.js'

// mocks
const next = jest.fn()
const logger = {
  info: jest.fn(),
}

describe('Parse Alarm Options', () => {
  it('Normalizes valid options', () => {
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          performSceneChangeDetection: true,
          sceneChangeReferenceUrls: ['https://example.com'],
        },
      },
      logger,
    }

    parseAlarmOptions(ctx, req, null, next)
    const { sceneChange } = ctx.options

    expect(sceneChange).toEqual({
      force: true,
      perform: true,
      referenceUrls: [{ url: 'https://example.com' }],
      references: [{ url: 'https://example.com' }],
    })
  })

  it('Ignores extra options', () => {
    // Arrange
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          extra: 'extra',
        },
      },
      logger,
    }

    // Act
    parseAlarmOptions(ctx, req, null, next)
    const { extra } = ctx.options

    // Assert
    expect(extra).toBe(undefined)
  })

  it
    .each([
      'not an array',
      ['not a url'],
    ])(
      'Throws an error for invalid sceneChangeReferenceUrls',
      (sceneChangeReferenceUrls) => {
        const ctx = {
          cameraData: {},
        }
        const res = httpMocks.createResponse()
        const req = {
          body: {
            options: {
              sceneChangeReferenceUrls,
            },
          },
          logger,
        }

        parseAlarmOptions(ctx, req, res, next)
        expect(res.statusCode).toEqual(400)
      },
    )
})

describe('Parse Chip Options', () => {
  it('Returns default options for chips', () => {
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {},
      logger,
    }

    parseChipOptions(ctx, req, null, next)

    expect(ctx.options).toEqual({
      sceneChange: {
        force: true,
        perform: false,
      },
      faceChips: {
        embeddingsVersion: '5',
      },
      analysisType: {},
    })
  })

  it('Ignores extra options', () => {
    // Arrange
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          extra: 'extra',
        },
      },
      logger,
    }

    // Act
    parseChipOptions(ctx, req, null, next)
    const { extra } = ctx.options

    // Assert
    expect(extra).toBe(undefined)
  })

  it('Allows setting face chips embeddings to version 6', () => {
    // Arrange
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          faceChipsEmbeddingsVersion: '6',
        },
      },
      logger,
    }

    // Act
    parseChipOptions(ctx, req, null, next)
    const { faceChips } = ctx.options

    // Assert
    expect(faceChips.embeddingsVersion).toBe('6')
  })

  it('Throws an error if face chips embeddings is not "5" or "6"', () => {
    // Arrange
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          faceChipsEmbeddingsVersion: 'bad version',
        },
      },
      logger,
    }
    const res = httpMocks.createResponse()

    // Act
    parseChipOptions(ctx, req, res, next)
    // Assert
    expect(res.statusCode).toEqual(400)
  })

  it('Allows setting an analysis type in "options"', () => {
    // Arrange
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          analysisType: {
            personAnalysis: {},
          },
        },
      },
      logger,
    }

    // Act
    parseChipOptions(ctx, req, null, next)

    // Assert
    expect(ctx.options).toEqual({
      sceneChange: {
        force: true,
        perform: false,
      },
      faceChips: {
        embeddingsVersion: '5',
      },
      analysisType: {
        personAnalysis: {},
      },
    })
  })

  it('Throws an error if more than one analysis type is specified', () => {
    // Arrange
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          analysisType: {
            personAnalysis: {},
            vehicleAnalysis: {},
          },
        },
      },
      logger,
    }
    const res = httpMocks.createResponse()

    // Act
    parseChipOptions(ctx, req, res, next)
    // Assert
    expect(res.statusCode).toEqual(400)
  })

  it('Throws an error if no analysis types are specified', () => {
    // Arrange
    const ctx = {
      cameraData: {},
    }
    const req = {
      body: {
        options: {
          analysisType: {},
        },
      },
      logger,
    }
    const res = httpMocks.createResponse()

    // Act
    parseChipOptions(ctx, req, res, next)
    // Assert
    expect(res.statusCode).toEqual(400)
  })
})
