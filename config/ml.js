const {
  FACES_ML_HOST = 'faces-serve-svc.ai.svc.cluster.local.',
  FACES_ML_PORT = '8000',
  FACES_ML_PROTOCOL = 'http',
} = process.env

const NO_OF_ML_ATTEMPTS = process.env.NO_OF_ML_ATTEMPTS ? Number(process.env.NO_OF_ML_ATTEMPTS) : 2

export {
  FACES_ML_HOST as facesMlHost,
  FACES_ML_PORT as facesMlPort,
  FACES_ML_PROTOCOL as facesMlProtocol,
  NO_OF_ML_ATTEMPTS as noOfMlAttempts,
}
