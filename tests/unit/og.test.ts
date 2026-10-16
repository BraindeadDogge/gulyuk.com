import { describe, expect, it } from 'vitest'
import { TAGLINE_MAX, ideaTagline } from '../../shared/og/tagline'

describe('ideaTagline', () => {
  it('uses the tagline from the frontmatter, trimmed', () => {
    expect(ideaTagline('  A short line.  ', 'Summary one. Summary two.')).toBe('A short line.')
  })

  it('falls back to the first sentence of the summary when there is no tagline', () => {
    expect(ideaTagline(undefined, 'A school visit with 10th graders. And what they said.')).toBe('A school visit with 10th graders.')
    expect(ideaTagline('   ', 'First part! Second part.')).toBe('First part!')
  })

  it('does not split on numbers like 93% or 2.5', () => {
    expect(ideaTagline(undefined, 'About 93% of them said 2.5 times more. Next sentence.')).toBe('About 93% of them said 2.5 times more.')
  })

  it('keeps a short summary without punctuation whole', () => {
    expect(ideaTagline(undefined, 'Starting in the Agentic team')).toBe('Starting in the Agentic team')
  })

  it('cuts a long first sentence at a word boundary with an ellipsis, within the limit', () => {
    const long = 'A model is a function you cannot write down, so you build one out of simple parts and tune it until it fits and then some more words.'
    const out = ideaTagline(undefined, long)
    expect(out.length).toBeLessThanOrEqual(TAGLINE_MAX)
    expect(out.endsWith('…')).toBe(true)
    expect(long.startsWith(out.slice(0, -1).trimEnd())).toBe(true)
    expect(out).not.toMatch(/\s…$/)
  })

  it('never returns more than the limit, even for a long word with no spaces', () => {
    expect(ideaTagline(undefined, 'x'.repeat(200)).length).toBeLessThanOrEqual(TAGLINE_MAX)
  })

  it('returns an empty string when there is nothing to show', () => {
    expect(ideaTagline(undefined, '')).toBe('')
  })
})
