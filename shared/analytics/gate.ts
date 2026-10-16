// Whether visit statistics may run at all. Everything that decides "no" lives here, so the rest of the site
// never has to know about opt-outs, browser privacy signals or missing configuration.

export const OPT_OUT_KEY = 'gulyuk-optout'

type Reader = { getItem(key: string): string | null }
type Writer = { setItem(key: string, value: string): void; removeItem(key: string): void }

// The choice also lives here, so it holds for the whole visit even when the browser refuses to store anything.
let memory = false

export function isOptedOut(storage?: Reader | null): boolean {
  if (memory) return true
  try { return storage?.getItem(OPT_OUT_KEY) === '1' } catch { return false }
}

export function setOptedOut(storage: (Reader & Writer) | null | undefined, value: boolean): void {
  memory = value
  try {
    if (value) storage?.setItem(OPT_OUT_KEY, '1')
    else storage?.removeItem(OPT_OUT_KEY)
  } catch { /* private mode: the in-memory choice still applies to this visit */ }
}

type NavLike = { globalPrivacyControl?: boolean, doNotTrack?: string | null, msDoNotTrack?: string | null }

export function privacySignals(nav: NavLike, win?: { doNotTrack?: string | null }): { gpc: boolean, dnt: boolean } {
  const on = (v: unknown) => v === '1' || v === 'yes'
  return {
    gpc: nav.globalPrivacyControl === true,
    dnt: on(nav.doNotTrack) || on(nav.msDoNotTrack) || on(win?.doNotTrack),
  }
}

export function trackingAllowed(i: { host?: string, id?: string, optedOut: boolean, gpc: boolean, dnt: boolean }): boolean {
  return Boolean(i.host && i.id) && !i.optedOut && !i.gpc && !i.dnt
}
