// The short line on an idea's share card (the picture shown when its link is posted in a chat or on LinkedIn).

export const TAGLINE_MAX = 80

/** The idea's own `tagline`, or else the first sentence of its summary, cut at a word boundary to fit. */
export function ideaTagline(tagline: string | undefined, summary: string): string {
  const own = tagline?.trim()
  if (own) return own
  // Split after sentence-ending punctuation that is followed by a space, so "93%" and "2.5" stay whole.
  const first = (summary.trim().split(/(?<=[.!?])\s+/)[0] ?? '').trim()
  if (first.length <= TAGLINE_MAX) return first
  const room = first.slice(0, TAGLINE_MAX - 1)
  const at = room.lastIndexOf(' ')
  return `${(at > 0 ? room.slice(0, at) : room).trimEnd()}…`
}
