import { beforeEach, describe, expect, it } from 'vitest'
import { OPT_OUT_KEY, isOptedOut, privacySignals, setOptedOut, trackingAllowed } from '../../shared/analytics/gate'
import { cleanName, cleanProps, hostOf, stripUrl, validRef } from '../../shared/analytics/sanitize'
import { MAX_SECONDS, MILESTONES, createVisibleClock, newMilestones, progressRatio, roundSeconds } from '../../shared/analytics/progress'

const memoryStorage = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
}
const blockedStorage = {
  getItem: () => { throw new Error('blocked') },
  setItem: () => { throw new Error('blocked') },
  removeItem: () => { throw new Error('blocked') },
}

describe('privacy gate', () => {
  beforeEach(() => setOptedOut(null, false))

  const ok = { host: 'https://stats.example', id: 'abc', optedOut: false, gpc: false, dnt: false }
  it('allows tracking only when configured and nothing says no', () => {
    expect(trackingAllowed(ok)).toBe(true)
    expect(trackingAllowed({ ...ok, host: '' })).toBe(false)
    expect(trackingAllowed({ ...ok, id: undefined })).toBe(false)
    expect(trackingAllowed({ ...ok, optedOut: true })).toBe(false)
    expect(trackingAllowed({ ...ok, gpc: true })).toBe(false)
    expect(trackingAllowed({ ...ok, dnt: true })).toBe(false)
  })

  it('reads Global Privacy Control and every spelling of Do Not Track', () => {
    expect(privacySignals({ globalPrivacyControl: true })).toEqual({ gpc: true, dnt: false })
    expect(privacySignals({ doNotTrack: '1' }).dnt).toBe(true)
    expect(privacySignals({ doNotTrack: 'yes' }).dnt).toBe(true)
    expect(privacySignals({ msDoNotTrack: '1' }).dnt).toBe(true)
    expect(privacySignals({}, { doNotTrack: '1' }).dnt).toBe(true)
    expect(privacySignals({ doNotTrack: '0', globalPrivacyControl: false })).toEqual({ gpc: false, dnt: false })
    expect(privacySignals({ doNotTrack: null })).toEqual({ gpc: false, dnt: false })
  })

  it('stores and clears the opt-out', () => {
    const s = memoryStorage()
    expect(isOptedOut(s)).toBe(false)
    setOptedOut(s, true)
    expect(s.getItem(OPT_OUT_KEY)).toBe('1')
    expect(isOptedOut(s)).toBe(true)
    setOptedOut(s, false)
    expect(isOptedOut(s)).toBe(false)
  })

  it('still honours an opt-out for the visit when the browser blocks storage', () => {
    setOptedOut(blockedStorage, true)
    expect(isOptedOut(blockedStorage)).toBe(true)
    setOptedOut(blockedStorage, false)
    expect(isOptedOut(blockedStorage)).toBe(false)
  })

  it('treats unreadable storage as "not opted out" rather than throwing', () => {
    expect(isOptedOut(blockedStorage)).toBe(false)
    expect(isOptedOut(null)).toBe(false)
  })
})

describe('sanitising', () => {
  it('accepts only small lower-case event names', () => {
    expect(cleanName('read-50')).toBe('read-50')
    expect(cleanName('Read 50')).toBeNull()
    expect(cleanName('')).toBeNull()
    expect(cleanName('a'.repeat(41))).toBeNull()
    expect(cleanName(42)).toBeNull()
    expect(validRef('acme-recruiter')).toBe('acme-recruiter')
    expect(validRef('Acme Recruiter!')).toBeNull()
    expect(validRef(null)).toBeNull()
  })

  it('removes query strings and fragments from URLs', () => {
    expect(stripUrl('https://a.example/p/q?x=1#top')).toBe('https://a.example/p/q')
    expect(stripUrl('/cv?ref=x#h')).toBe('/cv')
    expect(stripUrl('/cv')).toBe('/cv')
  })

  it('keeps only strings and finite numbers, shortens them, and strips URLs inside them', () => {
    expect(cleanProps(undefined)).toBeUndefined()
    expect(cleanProps({})).toBeUndefined()
    expect(cleanProps({ idea: 'x', n: 3, bad: NaN, obj: {}, arr: [1], nul: null, fn: () => 1 })).toEqual({ idea: 'x', n: 3 })
    expect(cleanProps({ idea: 'y'.repeat(200) })!.idea).toHaveLength(80)
    expect(cleanProps({ url: 'https://a.example/p?token=secret#frag' })).toEqual({ url: 'https://a.example/p' })
    expect(cleanProps({ 'Bad Key': 'v', ok: 'v' })).toEqual({ ok: 'v' })
    const many = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, i]))
    expect(Object.keys(cleanProps(many)!)).toHaveLength(10)
  })

  it('reports the destination host of outbound links only', () => {
    expect(hostOf('https://www.linkedin.com/in/x?y=1', 'gulyuk.com')).toBe('www.linkedin.com')
    expect(hostOf('https://github.com/a', 'gulyuk.com')).toBe('github.com')
    expect(hostOf('/cv', 'gulyuk.com')).toBeNull()
    expect(hostOf('https://gulyuk.com/cv', 'gulyuk.com')).toBeNull()
    expect(hostOf('https://www.gulyuk.com/cv', 'gulyuk.com')).toBeNull()
    expect(hostOf('mailto:a@b.c', 'gulyuk.com')).toBeNull()
    expect(hostOf('javascript:void(0)', 'gulyuk.com')).toBeNull()
    expect(hostOf('http://[bad', 'gulyuk.com')).toBeNull()
  })
})

describe('reading progress', () => {
  it('measures how much of the article has been scrolled past', () => {
    expect(progressRatio(800, 4000, 800)).toBe(0) // article starts exactly at the bottom edge
    expect(progressRatio(0, 4000, 1000)).toBeCloseTo(0.25)
    expect(progressRatio(-3000, 4000, 1000)).toBe(1)
    expect(progressRatio(-9000, 4000, 1000)).toBe(1)
    expect(progressRatio(900, 4000, 800)).toBe(0)
    expect(progressRatio(0, 0, 800)).toBe(0)
  })

  it('returns each milestone once, in order, however the reader jumps', () => {
    const fired = new Set<number>()
    expect(newMilestones(0.1, fired)).toEqual([])
    expect(newMilestones(0.3, fired)).toEqual([25])
    fired.add(25)
    expect(newMilestones(0.3, fired)).toEqual([])
    expect(newMilestones(1, fired)).toEqual([50, 75, 100])
    expect(MILESTONES).toEqual([25, 50, 75, 100])
  })

  it('counts 100 % a hair early so sub-pixel rounding cannot block it', () => {
    expect(newMilestones(0.996, new Set())).toContain(100)
    expect(newMilestones(0.98, new Set())).not.toContain(100)
  })

  it('rounds reading time to 15 seconds and caps it', () => {
    expect(roundSeconds(3000)).toBe(0)
    expect(roundSeconds(8000)).toBe(15)
    expect(roundSeconds(61_000)).toBe(60)
    expect(roundSeconds(99 * 60_000)).toBe(MAX_SECONDS)
  })

  it('adds up only the time the page was visible', () => {
    let t = 0
    const clock = createVisibleClock(() => t)
    clock.show(); t = 4000; clock.hide()
    t = 50_000 // hidden for a long time: not counted
    clock.show(); t = 56_000
    expect(clock.ms()).toBe(10_000)
    clock.hide(); clock.hide() // hiding twice is harmless
    expect(clock.ms()).toBe(10_000)
  })
})
