// Reading progress without any DOM: the browser code feeds it numbers and acts on what comes back.

export const MILESTONES = [25, 50, 75, 100] as const
export const MAX_SECONDS = 1200

/** Share of the article that has scrolled past the bottom edge of the viewport, from 0 to 1. */
export function progressRatio(top: number, height: number, viewport: number): number {
  if (height <= 0) return 0
  return Math.min(1, Math.max(0, (viewport - top) / height))
}

/** Milestones reached by `ratio` that are not in `fired` yet. 100 % counts from 99.5 % so sub-pixel rounding cannot block it. */
export function newMilestones(ratio: number, fired: ReadonlySet<number>): number[] {
  return MILESTONES.filter(m => !fired.has(m) && ratio * 100 >= m - 0.5)
}

export function roundSeconds(ms: number): number {
  return Math.round(Math.min(MAX_SECONDS, ms / 1000) / 15) * 15
}

/** Adds up only the time the page was on screen. */
export function createVisibleClock(now: () => number) {
  let since: number | null = null
  let total = 0
  return {
    show() { if (since === null) since = now() },
    hide() { if (since !== null) { total += now() - since; since = null } },
    ms: () => total + (since === null ? 0 : now() - since),
  }
}
