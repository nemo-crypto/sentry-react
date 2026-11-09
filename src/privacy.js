const privateKey = /^(authorization|cookie|password|passwd|token|access_token|refresh_token|secret|email|ip_address)$/i
export function stripUrl(value) {
  if (typeof value !== 'string') return value
  try { const url = new URL(value); return `${url.origin}${url.pathname}` } catch { return value.split(/[?#]/)[0] }
}
function scrub(value, key = '') {
  if (privateKey.test(key)) return '[Filtered]'
  if (Array.isArray(value)) return value.map(item => scrub(item))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v, k)]))
  if (/^(url|from|to)$/.test(key)) return stripUrl(value)
  return value
}
export function sanitizeEvent(event) {
  const clean = scrub(event)
  if (clean.request) {
    delete clean.request.headers
    delete clean.request.cookies
    delete clean.request.data
    delete clean.request.query_string
  }
  if (clean.user) clean.user = clean.user.id ? { id: clean.user.id } : undefined
  return clean
}
export function sanitizeBreadcrumb(breadcrumb) {
  if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') return null
  const clean = scrub(breadcrumb)
  if (clean.data) { delete clean.data.headers; delete clean.data.body }
  if (clean.message?.length > 300) clean.message = clean.message.slice(0, 300) + '…'
  return clean
}
