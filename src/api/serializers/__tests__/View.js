import { View } from '../index.js'

const testSiteId = 'testSiteId'

const mockView = {
  calipsaViewId: 'testViewId',
  integratorId: 'testIntegratorId',
  name: 'testViewName',
  masks: [],
  createdAt: 'testTimestamp',
  updatedAt: 'testTimestamp',
  viewStatus: {},
  thermal: false,
  tampering: false,
  tamperingConfig: {},
}

const mockViews = [mockView]

describe('Render JSON:API response bodies for multiple views', () => {
  it('Should create a response body with the correct structure', () => {
    // Act
    const responseBody = View.render(mockViews, testSiteId)

    // Assert
    expect(responseBody).toEqual(expect.objectContaining({
      links: expect.any(Object),
      data: [
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          attributes: expect.any(Object),
          links: expect.any(Object),
        }),
      ],
    }))
  })

  it('Should create correct response structure when snapshotSet is true', () => {
    // Act
    const responseBody = View.render([{
      ...mockView,
      snapshotSet: true,
    }], testSiteId)

    // Assert
    expect(responseBody.data[0].links).toEqual(expect.objectContaining({
      self: expect.any(String),
      'http://calipsa.io/relation/current-image': expect.any(String),
    }))
  })
})

describe('Render JSON:API response bodies for a single view', () => {
  it('Should create a response body with the correct structure', () => {
    // Act
    const responseBody = View.render(mockView, testSiteId)

    // Assert
    expect(responseBody).toEqual(expect.objectContaining({
      data: expect.objectContaining({
        id: expect.any(String),
        type: expect.any(String),
        attributes: expect.any(Object),
        links: expect.any(Object),
      }),
    }))
    expect(responseBody.links).toEqual(expect.not.objectContaining({
      self: expect.any(Object),
    }))
  })
})
