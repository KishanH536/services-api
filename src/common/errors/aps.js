class ApsInvalidImagesError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ApsInvalidImagesError'
  }
}

export default ApsInvalidImagesError
