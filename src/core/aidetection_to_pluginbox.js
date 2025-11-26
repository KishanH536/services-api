const detectionClassesMap = {
  1: 'cyclist',
  2: 'car',
  3: 'truck',
  4: 'person',
  5: 'construction_vehicle',
}

/**
 * Returns the detection type corresponding to the given index.
 * @param {number} index - The index of the detection class type.
 * @returns {string} - The detection class type.
 */
function objectIndexToType(index) {
  if (index === undefined || index === null || index < 1 || index > 5) {
    return ''
  }

  return detectionClassesMap[index]
}

/**
 * Round to the number of significant digits specified.
 * @param  {} number
 * @param  {} digits
 */
function roundSignificantly(number, digits) {
  return +number.toPrecision(digits)
}

/**
 * Scales and rounds the bounding box coordinates of an image based on its metadata.
 * @param {Object} boundingBox The bounding box coordinates to normalize.
 * @param {Object} imageMetadata The metadata of the image.
 * @returns {Object} The normalized bounding box coordinates.
 */
const normalizeBoundingBox = (boundingBox, imageMetadata = {}) => {
  const {
    x1,
    y1,
    x2,
    y2,
  } = boundingBox

  const {
    width = 1,
    height = 1,
  } = imageMetadata

  return {
    x1: roundSignificantly(x1 / width, 3),
    y1: roundSignificantly(y1 / height, 3),
    x2: roundSignificantly(x2 / width, 3),
    y2: roundSignificantly(y2 / height, 3),
  }
}

/**
 * Transforms a chip detection result.
 * @param {Object} detection - The chip result to transform.
 * @param {Object} imageMetadata - The width and height of the image
 * that the detection was detected in.
 * @returns {Object} The transformed chip result.
 */
const transformChipResult = (detection, imageMetadata = {}) => {
  const { box, ...rest } = detection

  return {
    box: normalizeBoundingBox(box, imageMetadata),
    ...rest,
  }
}

/**
 * Transforms an object detection result.
 *
 * @param {Array<{
 *  0: number, // x1
 *  1: number, // y1
 *  2: number, // x2
 *  3: number, // y2
 *  4: number, // objectIndex
 * }>} detection - The object detection result to transform.
 * @returns {Object} The transformed object detection result.
 */
const transformObjectDetectionResult = (detection) => {
  const [x1, y1, x2, y2, objectIndex] = detection

  return {
    ...normalizeBoundingBox({
      x1,
      y1,
      x2,
      y2,
    }),
    objectType: objectIndexToType(objectIndex),
  }
}

/**
 * Normalizes the chip data by mapping each inner detection using the image metadata for scaling.
 * @param {Array<Array<Object>>} detectionsByImage - An array of arrays of detection objects.
 * @param {Array<Object>} imagesMetadata - An array of image metadata objects.
 * @returns {Array<Array<Object>>} An array of arrays of normalized detection objects
 */
export const normalizeChipDetections = (detectionsByImage, imagesMetadata) => {
  if (!detectionsByImage?.length) {
    return
  }

  // Normalize the chip data:
  // For each set of image detections,
  // map each inner detection using the image metadata for scaling.
  return detectionsByImage.map(
    (detections, i) =>
      detections.map(
        detection => transformChipResult(detection, imagesMetadata[i]),
      ),
  )
}

/**
 * Convert AI detection box normalized values [x1, y1, x2, y2] to (x1, y1, x2, y2, objectType)
 *
 * @param {[[]: number]} detections
 */
export const normalizeObjectDetections = (detections, totalImages) => {
  const boundingBoxes = []
  for (let i = 0; i < totalImages; i++) {
    let newDetections = []
    const oldDetections = detections && detections[i]
    if (oldDetections && oldDetections.length) {
      newDetections = oldDetections.map(transformObjectDetectionResult)
    }
    boundingBoxes.push(newDetections)
  }
  return boundingBoxes
}
