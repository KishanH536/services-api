export function removeFaceEmbeddings(faceImages) {
  if (!faceImages?.length) {
    return faceImages
  }

  return faceImages.map(faces => {
    if (!faces?.length) {
      return faces
    }
    return faces.map(
      ({ embedding, ...otherFaceProps }) => ({
        embeddingLength: embedding?.length,
        ...otherFaceProps,
      }),
    )
  })
}

export function removeChipEmbeddings(chips) {
  if (!chips?.length) {
    return chips
  }

  return chips.map(({ embedding, ...otherChipProps }) => ({
    embeddingLength: embedding?.length,
    ...otherChipProps,
  }))
}

export const removePersonChipEmbeddings = removeChipEmbeddings
export const removeVehicleChipEmbeddings = removeChipEmbeddings

export function removeDetectionsEmbeddings(detections, type) {
  if (!detections?.length) {
    return detections
  }

  return detections.map(({ [type]: items }) => {
    const itemsWithoutEmbeddings = items.map(({ attributes, ...restOfItem }) => {
      const { embedding, ...restOfAttributes } = attributes
      const embeddingLength = embedding?.length
      return {
        ...restOfItem,
        attributes: {
          ...restOfAttributes,
          embeddingLength,
        },
      }
    })
    return itemsWithoutEmbeddings
  })
}

export const removePersonFullEmbeddings = (detections) =>
  removeDetectionsEmbeddings(
    detections,
    'persons',
  )

export const removeVehicleFullEmbeddings = (detections) =>
  removeDetectionsEmbeddings(
    detections,
    'vehicles',
  )
