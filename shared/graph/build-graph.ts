import type { CvInput, Graph, GraphEdge, GraphNode, IdeaInput } from './types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Fixed-locale, timezone-free date formatting so server and client agree. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`
}

/** Fallback label when the vocabulary has none: "ml-fundamentals" becomes "ml fundamentals". */
export function topicLabel(slug: string): string {
  return slug.replace(/-/g, ' ')
}

/**
 * Pure: turns content into nodes and edges. Positions are zero here; see layout.ts.
 * Nodes are sorted by id so the output (and therefore the layout) is deterministic.
 *
 * The big nodes are the AREAS (a handful, from content/taxonomy.yml). Topics are tags and never
 * become nodes, so the graph stays readable however many ideas and topics there are. Ideas link to
 * their area, and to each other only where that says something the areas do not:
 *  - they share a topic but sit in different areas, or
 *  - they share two or more topics inside the same area.
 */
export function buildGraph(ideas: IdeaInput[], cv: CvInput | null, labels: Record<string, string> = {}): Graph {
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const areaCounts = new Map<string, number>()

  const add = (n: Omit<GraphNode, 'x' | 'y' | 'degree'>) => nodes.set(n.id, { ...n, x: 0, y: 0, degree: 0 })

  for (const idea of ideas) areaCounts.set(idea.area, (areaCounts.get(idea.area) ?? 0) + 1)
  for (const item of [...(cv?.experience ?? []), ...(cv?.skills ?? [])])
    for (const a of item.areas) if (!areaCounts.has(a)) areaCounts.set(a, 0)

  for (const [area, count] of areaCounts) {
    add({
      id: `topic:${area}`,
      kind: 'topic',
      label: labels[area] ?? topicLabel(area),
      caption: `${count} ${count === 1 ? 'idea' : 'ideas'}`,
      href: `/topics/${area}`,
      r: Math.min(26, 14 + count * 1.6),
    })
  }

  for (const idea of ideas) {
    add({
      id: `idea:${idea.slug}`,
      kind: 'idea',
      label: idea.title,
      caption: [formatDate(idea.date), idea.kind].filter(Boolean).join(' · '),
      href: `/ideas/${idea.slug}`,
      r: 6.5,
    })
    edges.push({ source: `idea:${idea.slug}`, target: `topic:${idea.area}`, type: 'topic' })
  }

  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const a = ideas[i]!, b = ideas[j]!
      const shared = a.topics.filter(t => b.topics.includes(t)).length
      if ((a.area !== b.area && shared >= 1) || (a.area === b.area && shared >= 2))
        edges.push({ source: `idea:${a.slug}`, target: `idea:${b.slug}`, type: 'related' })
    }
  }

  if (cv) {
    add({ id: 'cv:root', kind: 'cv', label: 'CV', caption: 'curriculum vitae', href: '/cv', r: 9 })
    for (const e of cv.experience) {
      add({ id: `cv:${e.id}`, kind: 'cv', label: `${e.role}, ${e.org}`, caption: 'experience', href: `/cv#${e.id}`, r: 4.5 })
      edges.push({ source: `cv:${e.id}`, target: 'cv:root', type: 'cv' })
      for (const a of e.areas) edges.push({ source: `cv:${e.id}`, target: `topic:${a}`, type: 'cv-topic' })
    }
    for (const s of cv.skills) {
      add({ id: `cv:${s.id}`, kind: 'cv', label: s.group, caption: 'skills', href: `/cv#${s.id}`, r: 4.5 })
      edges.push({ source: `cv:${s.id}`, target: 'cv:root', type: 'cv' })
      for (const a of s.areas) edges.push({ source: `cv:${s.id}`, target: `topic:${a}`, type: 'cv-topic' })
    }
  }

  const sorted = [...nodes.values()].sort((a, b) => (a.id < b.id ? -1 : 1))
  for (const e of edges) {
    nodes.get(e.source)!.degree++
    nodes.get(e.target)!.degree++
  }
  edges.sort((a, b) => (a.source + a.target < b.source + b.target ? -1 : 1))
  return { nodes: sorted, edges }
}
