import { jest } from '@jest/globals'
import httpMocks from 'node-mocks-http'

import {
  configureChipDetections,
} from '../middleware/detections.js'

// mocks
const next = jest.fn()

describe('Assemble chip detections', () => {
  it('Assembles feature-based detections without options.analysisType', () => {
    const ctx = {
      features: {
        personAnalysis: {},
        advancedRules: [
          {
            integratorId: 'xyz',
            name: 'gun rule',
            gunDetection: {},
          },
        ],
      },
      options: {
        sceneChange: {
          force: true,
          perform: false,
        },
        faceChips: { embeddingsVersion: '5' },
        analysisType: {},
      },
    }

    configureChipDetections(ctx, null, null, next)
    const { detections } = ctx

    // Removed the persons object from detections, since the new priority filter
    // only ever sets one chip detection.
    expect(detections).toEqual({
      gun: {
        chips: true,
      },
    })
  })

  it('Assembles client-specified detection with options.analysisType set', () => {
    const ctx = {
      features: {
        personAnalysis: {},
        advancedRules: [
          {
            integratorId: 'xyz',
            name: 'gun rule',
            gunDetection: {},
          },
        ],
        vehicleAnalysis: { chipsType: 'vehicles' },
      },
      options: {
        sceneChange: {
          force: true,
          perform: false,
        },
        faceChips: { embeddingsVersion: '5' },
        analysisType: { personAnalysis: {} },
      },
    }

    configureChipDetections(ctx, null, null, next)
    const { detections } = ctx

    expect(detections).toEqual({
      person: {
        chips: true,
      },
    })
  })

  it('Should return 400 with options.analysisType set that does not match features', () => {
    const ctx = {
      features: {
        personAnalysis: {},
        advancedRules: [
          {
            integratorId: 'xyz',
            name: 'gun rule',
            gunDetection: {},
          },
        ],
      },
      options: {
        sceneChange: {
          force: true,
          perform: false,
        },
        faceChips: { embeddingsVersion: '5' },
        analysisType: { vehicleAnalysis: {} },
      },
    }
    const res = httpMocks.createResponse()

    configureChipDetections(ctx, null, res, next)
    expect(res.statusCode).toEqual(400)
  })

  it
    .each([
      {
        featuresVehicleAnalysisChipsType: 'vehicles',
        analysisTypeVehicleAnalysisChipsType: 'plates',
        expectation: {
          lpr: { chips: true },
        },
      },
      {
        featuresVehicleAnalysisChipsType: 'plates',
        analysisTypeVehicleAnalysisChipsType: 'vehicles',
        expectation: {
          vehicle: { chips: true },
        },
      },
    ])(
      'Should return correct detections with options.analysisType and features set for either "plates" and "vehicles"',
      ({
        featuresVehicleAnalysisChipsType,
        analysisTypeVehicleAnalysisChipsType,
        expectation,
      }) => {
        const ctx = {
          features: {
            personAnalysis: {},
            advancedRules: [
              {
                integratorId: 'xyz',
                name: 'gun rule',
                gunDetection: {},
              },
            ],
            vehicleAnalysis: { chipsType: featuresVehicleAnalysisChipsType },
          },
          options: {
            sceneChange: {
              force: true,
              perform: false,
            },
            faceChips: { embeddingsVersion: '5' },
            analysisType: { vehicleAnalysis: { chipsType: analysisTypeVehicleAnalysisChipsType } },
          },
        }

        configureChipDetections(ctx, null, null, next)
        const { detections } = ctx

        expect(detections).toEqual(expectation)
      },
    )
})
