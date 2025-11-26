const withChecks = (payload) => ({
  withChecks: payload,
})

const noChecks = (references) => ({
  noChecks: {
    references,
  },
})

const notEligible = (reason) => withChecks({
  notEligible: reason,
})

const companyIsNotEligible = (companyId) => notEligible({
  companyId,
})

const viewIsNotEligible = (viewId) => notEligible({
  viewId,
})

const notEligibleForTampering = () => notEligible({
  isTampering: false,
})

const noReferences = () => withChecks({
  unable: {
    noReferenceImage: true,
  },
})

const skip = (payload) => withChecks({
  skip: payload || {},
})

const skipPeriodDetection = () => skip({
  periodDetection: {},
})

const skipReferenceImage = () => skip({
  noReferenceImage: true,
})

const proceed = (tamperingConfig, timezone) => withChecks({
  proceed: {
    tamperingConfig,
    timezone,
  },
})

export {
  companyIsNotEligible,
  viewIsNotEligible,
  notEligibleForTampering,
  noReferences,
  skip,
  skipReferenceImage,
  skipPeriodDetection,
  proceed,
  noChecks,
}
