import { createVisibleClock, newMilestones, progressRatio, roundSeconds } from '~~/shared/analytics/progress'

// Dwell time before an unscrolled page counts as read, so a page that fits on one screen is not "100 %" on arrival.
const DWELL_MS = 5000
const MIN_READ_SECONDS = 8

/** Reports how far down an article the reader got and for how long it was on screen. One call per page. */
export function useReadingProgress(getEl: () => HTMLElement | null, idea: string) {
  const track = useTrack()

  onMounted(() => {
    const el = getEl()
    if (!el) return

    const fired = new Set<number>()
    let ended = false
    let ticking = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const clock = createVisibleClock(() => performance.now())
    if (document.visibilityState === 'visible') clock.show()

    function check() {
      ticking = false
      if (!el) return
      const r = el.getBoundingClientRect()
      for (const m of newMilestones(progressRatio(r.top, r.height, innerHeight), fired)) {
        fired.add(m)
        track(`read-${m}`, { idea })
      }
      const related = document.querySelector('.related')
      if (!ended && related && related.getBoundingClientRect().top < innerHeight) {
        ended = true
        track('read-end', { idea })
      }
    }
    // Scrolling only counts once the reader has done something: the router scrolls a new page to the top on its
    // own, and that must not look like reading.
    let armed = false
    const arm = () => { armed = true }
    const onScroll = () => {
      if (!armed || ticking) return
      ticking = true
      requestAnimationFrame(check)
    }
    // The dwell timer only runs while the page is on screen, so a tab opened in the background is not "read".
    const startDwell = () => {
      clearTimeout(timer)
      if (document.visibilityState === 'visible') timer = setTimeout(check, DWELL_MS)
    }

    let reported = false
    function report() {
      if (reported) return
      if (clock.ms() / 1000 < MIN_READ_SECONDS) return
      reported = true
      track('read-time', { idea, seconds: roundSeconds(clock.ms()) })
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') { clock.show(); startDwell() }
      else { clock.hide(); clearTimeout(timer); report() }
    }

    const INPUTS = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const
    INPUTS.forEach(t => window.addEventListener(t, arm, { passive: true, once: true }))
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('pagehide', report)
    document.addEventListener('visibilitychange', onVisibility)
    startDwell()

    onBeforeUnmount(() => {
      report()
      clearTimeout(timer)
      INPUTS.forEach(t => window.removeEventListener(t, arm))
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('pagehide', report)
      document.removeEventListener('visibilitychange', onVisibility)
    })
  })
}
