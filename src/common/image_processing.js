import sharp from 'sharp'

sharp.cache(false)

/**
 *
 * @param {Buffer} buffer
 * @returns {Promise<{width: int, height: int, format: string}>}
 */
export const getMetadata = async (buffer) => await sharp(buffer).metadata()

/**
 * @param {Buffer} image
 * @param {int} newWidth
 * @param {int} newHeight
 * @param {boolean} fill
 *
 * @returns {Promise<{Buffer}>}
 */
export const resizeImage = async (image, newWidth = 320, newHeight = 240, fill = true) => {
  if (fill) {
    return await sharp(image, { failOnError: false })
      .resize(newWidth, newHeight, { fit: 'fill' })
      .toBuffer()
  }

  return await sharp(image, { failOnError: false })
    .resize(newWidth, newHeight)
    .toBuffer()
}
