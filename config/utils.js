const slash = '/'

export function normalizePath(path) {
  if (
    path == null
    || path === ''
    || path === slash
  ) {
    return ''
  }
  const normalized = path.endsWith(slash)
    ? path.slice(0, -1)
    : path
  return normalized.startsWith(slash)
    ? normalized
    : slash + normalized
}
