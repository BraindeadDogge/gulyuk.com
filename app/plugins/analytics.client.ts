// Visit statistics. Umami's script is loaded only when the privacy gate says yes, and every send re-checks the gate,
// so an opt-out takes effect immediately. Umami's own auto-tracking is off: pageviews and events are sent from here.
import { isOptedOut, privacySignals, trackingAllowed } from '~~/shared/analytics/gate'
import { cleanName, cleanProps, hostOf, stripUrl, validRef } from '~~/shared/analytics/sanitize'
import type { Track } from '~/composables/useTrack'

type Umami = { track: (...args: unknown[]) => unknown }
declare global { interface Window { umami?: Umami } }

export default defineNuxtPlugin((nuxtApp) => {
  const cfg = useRuntimeConfig().public as { umamiHost: string, umamiId: string, umamiDomains: string }
  const storage = () => { try { return window.localStorage } catch { return null } }
  const allowed = () => trackingAllowed({
    host: cfg.umamiHost,
    id: cfg.umamiId,
    optedOut: isOptedOut(storage()),
    ...privacySignals(navigator, window as unknown as { doNotTrack?: string | null }),
  })

  let loading: Promise<void> | null = null
  function ensureScript(): Promise<void> {
    if (window.umami) return Promise.resolve()
    loading ??= new Promise<void>((resolve) => {
      const s = document.createElement('script')
      s.defer = true
      s.src = `${cfg.umamiHost.replace(/\/$/, '')}/script.js`
      s.dataset.websiteId = cfg.umamiId
      s.dataset.autoTrack = 'false'
      s.dataset.excludeSearch = 'true'
      s.dataset.excludeHash = 'true'
      if (cfg.umamiDomains) s.dataset.domains = cfg.umamiDomains
      s.onload = () => resolve()
      // A blocked or unreachable collector is not an error for the reader; try again on the next event.
      s.onerror = () => { s.remove(); loading = null; resolve() }
      document.head.append(s)
    })
    return loading
  }

  async function send(fn: (u: Umami) => void) {
    if (!allowed()) return
    await ensureScript()
    // The reader may have opted out while the script was loading.
    if (allowed() && window.umami) fn(window.umami)
  }

  const track: Track = (name, props) => {
    const n = cleanName(name)
    if (!n) return
    const p = cleanProps(props)
    // Events carry the path only, like pageviews, whatever the script would have sent by itself.
    void send(u => u.track((b: Record<string, unknown>) => ({
      ...b,
      name: n,
      data: p,
      url: location.pathname,
      referrer: stripUrl(String(b.referrer ?? '')),
    })))
  }

  // Pageviews carry the path only. A change of query or hash alone is not a new page.
  let lastPath: string | null = null
  function pageview() {
    const path = location.pathname
    if (path === lastPath) return
    const referrer = lastPath === null ? stripUrl(document.referrer) : location.origin + lastPath
    lastPath = path
    void send(u => u.track((p: Record<string, unknown>) => ({ ...p, url: path, referrer })))
  }
  nuxtApp.hook('page:finish', pageview)

  // Lets code that is not part of the Vue app (the essay's script) report events without importing anything.
  document.addEventListener('site:track', (e) => {
    const d = (e as CustomEvent<{ name?: unknown, props?: Record<string, unknown> }>).detail
    track(d?.name as string, d?.props)
  })

  // Links: `data-track="name"` (+ optional `data-site`) names a click; any link to another site also sends `outbound`.
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!a) return
    if (a.dataset.track) track(a.dataset.track, a.dataset.site ? { site: a.dataset.site } : undefined)
    const host = hostOf(a.href, location.hostname)
    if (host) track('outbound', { host })
  }
  document.addEventListener('click', onClick, true)
  document.addEventListener('auxclick', (e) => { if (e.button === 1) onClick(e) }, true)

  // A link shared with a label (`?ref=name`) is counted once and the label leaves the address bar. For prerendered
  // pages the router hydrates with the bare path and puts the query back afterwards, so the label is read from the
  // address the browser first loaded, and removed through the router whenever it shows up in the current route.
  const loaded = performance.getEntriesByType('navigation')[0]?.name ?? location.href
  const landingRef = validRef(new URL(loaded).searchParams.get('ref'))
  if (landingRef) {
    const router = useRouter()
    let pending = true
    const strip = () => {
      const { query, hash } = router.currentRoute.value
      if (!pending || !('ref' in query)) return
      pending = false
      const { ref: _ref, ...rest } = query
      void router.replace({ query: rest, hash })
    }
    router.afterEach(() => { void nextTick(strip) })
    nuxtApp.hook('app:mounted', async () => {
      track('landing', { ref: landingRef })
      await router.isReady()
      strip()
    })
  }

  return { provide: { track } }
})
