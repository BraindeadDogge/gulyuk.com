type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

function words(node: MinimarkNode): number {
  if (typeof node === 'string') return node.trim() ? node.trim().split(/\s+/).length : 0
  // Skip math: it reads as symbols, not words.
  if (node[0] === 'math') return 0
  return node.slice(2).reduce<number>((sum, child) => sum + words(child as MinimarkNode), 0)
}

/** Rough reading time from a Nuxt Content (minimark) body, at 220 words per minute. */
export function readingMinutes(body: { value?: unknown[] } | undefined): number {
  const total = (body?.value ?? []).reduce<number>((sum, n) => sum + words(n as MinimarkNode), 0)
  return Math.max(1, Math.round(total / 220))
}
