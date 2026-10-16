// Everything that leaves the browser as an event passes through here, so a slip in one call site cannot
// leak a query string, a long free-text value or a person's details.

const SLUG = /^[a-z0-9-]{1,40}$/
const KEY = /^[a-z][a-zA-Z0-9_]{0,30}$/
const URLISH = /^(https?:\/\/|\/)/i

export const MAX_STRING = 80
export const MAX_PROPS = 10

export function cleanName(name: unknown): string | null {
  return typeof name === 'string' && SLUG.test(name) ? name : null
}

/** The label in `?ref=`: lower-case letters, digits and hyphens that the site owner made up. */
export const validRef = cleanName

export function stripUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value)
      return u.origin + u.pathname
    } catch { /* fall through to the plain cut */ }
  }
  return value.split(/[?#]/)[0] ?? ''
}

export function cleanProps(props?: Record<string, unknown> | null): Record<string, string | number> | undefined {
  if (!props) return undefined
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(props)) {
    if (Object.keys(out).length >= MAX_PROPS) break
    if (!KEY.test(k)) continue
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    else if (typeof v === 'string') out[k] = (URLISH.test(v) ? stripUrl(v) : v).slice(0, MAX_STRING)
  }
  return Object.keys(out).length ? out : undefined
}

const bare = (h: string) => h.toLowerCase().replace(/^www\./, '')

/** The host of a link that leaves the site, or null for same-site, mailto: and other non-web links. */
export function hostOf(href: string, currentHost: string): string | null {
  let u: URL
  try { u = new URL(href, `https://${currentHost}`) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  return bare(u.hostname) === bare(currentHost) ? null : u.hostname.toLowerCase()
}
