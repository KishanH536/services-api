import getMultipartMiddleware from '../middleware/multipart_formdata.js'

import {
  wrapMiddleware,
} from '../utils/middleware.js'

// Platform-style (a.k.a. "Calipsa-style") handlers
import {
  createCompany,
  getCompany,
  getOwnCompany,
  updateCompany,
  patchOwnCompany,
  deleteCompany,
  getCompanies,
  upsertCompanyIntegrator,
  getCompanyIntegrator,
} from '../handlers/company/index.js'
import getClients from '../handlers/calipsa/get_clients.js'
import getClient from '../handlers/calipsa/get_client.js'
import addClient from '../handlers/calipsa/add_client.js'
import deleteClient from '../handlers/calipsa/delete_client.js'
import getSites from '../handlers/calipsa/get_sites.js'
import getSite from '../handlers/calipsa/get_site.js'
import addSite from '../handlers/calipsa/add_site.js'
import updateSite from '../handlers/calipsa/update_site.js'
import deleteSite from '../handlers/calipsa/delete_site.js'
import getViews from '../handlers/calipsa/get_cameras.js'
import getView from '../handlers/calipsa/get_camera.js'
import addView from '../handlers/calipsa/add_camera.js'
import updateView from '../handlers/calipsa/update_camera.js'
import deleteView from '../handlers/calipsa/delete_camera.js'
import getSnapshot from '../handlers/calipsa/get_snapshot.js'

// Integrator-style handlers
import getClientsIntegrator from '../handlers/integrator/get_clients.js'
import getClientIntegrator from '../handlers/integrator/get_client.js'
import addClientIntegrator from '../handlers/integrator/add_client.js'
import deleteClientIntegrator from '../handlers/integrator/delete_client.js'
import getSitesIntegrator from '../handlers/integrator/get_sites.js'
import getSiteIntegrator from '../handlers/integrator/get_site.js'
import addSiteIntegrator from '../handlers/integrator/add_site.js'
import deleteSiteIntegrator from '../handlers/integrator/delete_site.js'
import getViewsIntegrator from '../handlers/integrator/get_cameras.js'
import getViewIntegrator from '../handlers/integrator/get_camera.js'
import addViewIntegrator from '../handlers/integrator/add_camera.js'
import deleteViewIntegrator from '../handlers/integrator/delete_camera.js'
import getSnapshotIntegrator from '../handlers/integrator/get_snapshot.js'

// Platform and Integrator Style Scene Change handlers
import putReferenceImage from '../handlers/sceneChange/put_ref_image.js'

// Embeddings processing handlers
import convertEmbeddings from '../handlers/embeddings/convert.js'

// Analyses handlers
import {
  getAnalyses,
  getAnalysis,
  addAnnotation,
} from '../handlers/analyses/index.js'

// Platform and Integrator Style Alarm/Chip handlers
import {
  analyzeAlarm,
  analyzeChip,
  analyzeAlarmIntegrator,
  analyzeChipIntegrator,
  analyzeImages,
  analyzeImagesIntegrator,
} from '../handlers/analyze/index.js'

const calipsaOperations = {
  // Companies
  createCompany,
  getCompany,
  getOwnCompany,
  updateCompany,
  patchOwnCompany,
  deleteCompany,
  getCompanies,

  // Clients
  getClients,
  getClient,
  addClient,
  deleteClient,

  // Sites
  getSites,
  getSite,
  addSite,
  updateSite,
  deleteSite,

  // Views
  getViews,
  getView,
  addView,
  updateView,
  deleteView,

  // Snapshots
  getSnapshot,
}

const integratorOperations = {
  // Companies
  upsertCompanyIntegrator,
  getCompanyIntegrator,

  // Clients
  getClientsIntegrator,
  getClientIntegrator,
  addClientIntegrator,
  deleteClientIntegrator,

  // Sites
  getSitesIntegrator,
  getSiteIntegrator,
  addSiteIntegrator,
  deleteSiteIntegrator,

  // Views
  getViewsIntegrator,
  getViewIntegrator,
  addViewIntegrator,
  deleteViewIntegrator,

  // Snapshots
  getSnapshotIntegrator,
}

const sceneChangeOperations = {
  putDayReferenceImage: putReferenceImage,
  putNightReferenceImage: putReferenceImage,
  putDayReferenceImageIntegrator: putReferenceImage,
  putNightReferenceImageIntegrator: putReferenceImage,
}

const embeddingsOperations = {
  convertEmbeddings,
}

const analysesOperations = {
  getAnalyses,
  getAnalysis,
  addAnnotation,
}

const processMultipartForAnalyze = getMultipartMiddleware({
  imageFields: [
    'alarmImages',
    'chipImages',
  ],
  jsonFields: ['options'],
})

const all = {
  ...calipsaOperations,
  ...integratorOperations,
  ...sceneChangeOperations,
  ...embeddingsOperations,
  ...analysesOperations,
  analyzeAlarm: wrapMiddleware(processMultipartForAnalyze, analyzeAlarm),
  analyzeAlarmIntegrator: wrapMiddleware(processMultipartForAnalyze, analyzeAlarmIntegrator),
  analyzeChip: wrapMiddleware(processMultipartForAnalyze, analyzeChip),
  analyzeChipIntegrator: wrapMiddleware(processMultipartForAnalyze, analyzeChipIntegrator),
  analyzeImages,
  analyzeImagesIntegrator,
}

export default all
