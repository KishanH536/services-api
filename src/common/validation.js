export const validateTimeZone = (timeZone) => {
  if (typeof timeZone !== 'string') {
    return false
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone })
    return true
  }
  catch {
    return false
  }
}

export const validateUrl = (url) => {
  try {
    (() => new URL(url))()
    return true
  }
  catch {
    return false
  }
}
