import { jest } from '@jest/globals'

const mockSharp = jest.fn(() => mockSharp)
mockSharp.resize = jest.fn().mockReturnThis()
mockSharp.toBuffer = jest.fn(() => Buffer.from(''))
mockSharp.metadata = jest.fn(() => {})
mockSharp.cache = jest.fn().mockReturnThis()
jest.unstable_mockModule('sharp', () => ({
  default: mockSharp,
}))

const { resizeImage } = await import('../image_processing.js')

describe('Resize image', () => {
  beforeEach(() => {
    mockSharp.resize.mockClear()
  })

  it('Should resize an image with default values', async () => {
    const image = Buffer.from('')
    const resizedImage = await resizeImage(image)
    const [width, height, options] = mockSharp.resize.mock.calls[0]

    expect(width).toBe(320)
    expect(height).toBe(240)
    expect(options.fit).toEqual('fill')
    expect(resizedImage).toBeInstanceOf(Buffer)
  })

  it('Should resize an image with options values', async () => {
    const image = Buffer.from('')
    const resizedImage = await resizeImage(image, 100, 100, false)
    const [width, height, options] = mockSharp.resize.mock.calls[0]

    expect(width).toBe(100)
    expect(height).toBe(100)
    expect(options).toBeUndefined()
    expect(resizedImage).toBeInstanceOf(Buffer)
  })
})
