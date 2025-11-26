import {
  getReferences,
  getReferenceResponseUrl,
  sanitizeReference,
  hasReferenceImage,
} from '../scene_change.js'

const SAMPLE_IMAGE_URL = 'https://my-images.com/reference-image.jpg'

describe('Get References', () => {
  it('should return an array of reference image ids', () => {
    const tamperingConfig = {
      day: {
        referenceImage: 'day-reference-image-id',
      },
      night: {
        referenceImage: 'night-reference-image-id',
      },
    }

    const result = getReferences(tamperingConfig)

    expect(result).toEqual([
      {
        id: 'day-reference-image-id',
        label: 'day',
      },
      {
        id: 'night-reference-image-id',
        label: 'night',
      },
    ])
  })

  it
    .each([
      undefined,
      {},
      { day: {} },
      { night: {} },
    ])(
      'should return an empty array if no reference images are provided',
      (tamperingConfig) => {
        const result = getReferences(tamperingConfig)
        expect(result).toEqual([])
      },
    )
})

describe('Get Reference Response URL', () => {
  it('should return a URL object with the reference URL if it exists', () => {
    const reference = {
      url: SAMPLE_IMAGE_URL,
    }

    const result = getReferenceResponseUrl('dummy-id', reference)

    expect(result).toEqual({
      url: SAMPLE_IMAGE_URL,
    })
  })

  it('should create a URL from the ID and label', () => {
    const viewId = 'view-id'
    const reference = {
      id: 'reference-image-id',
      label: 'day',
    }

    const result = getReferenceResponseUrl(viewId, reference)

    expect(result).toEqual({
      url: '/views/view-id/snapshot?refImage=day',
    })
  })
})

describe('Sanitize Reference', () => {
  it('should return an object with only the ID if the reference has an id', () => {
    const reference = {
      id: 'reference-image-id',
      url: SAMPLE_IMAGE_URL,
    }

    const result = sanitizeReference(reference)

    expect(result).toEqual({ id: 'reference-image-id' })
  })

  it('should return an object with a URL if the reference does not have an id', () => {
    const reference = {
      id: undefined,
      url: SAMPLE_IMAGE_URL,
    }

    const result = sanitizeReference(reference)

    expect(result).toEqual({ url: SAMPLE_IMAGE_URL })
  })
})

describe('Has Reference Image', () => {
  it('Should return false if there is no tampering config', () => {
    const tamperingConfig = null
    const result = hasReferenceImage(tamperingConfig)
    expect(result).toBe(false)
  })

  it.each([
    [{ day: { referenceImage: 'day-id' } }, true],
    [{ night: { referenceImage: 'night-id' } }, true],
    [
      {
        day: { referenceImage: 'day-id' },
        night: { referenceImage: 'night-id' },
      },
      true,
    ],
    [{ day: {} }, false],
    [{ night: {} }, false],
    [{
      day: {},
      night: {},
    }, false],
  ])(
    'Should return true if there is a day or night reference image',
    (tamperingConfig, hasReference) => {
      const result = hasReferenceImage(tamperingConfig)
      expect(result).toBe(hasReference)
    },
  )
})
