import type { CvInput, Graph, GraphEdge, GraphNode, IdeaInput } from './types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Fixed-locale, timezone-free date formatting so server and client agree. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`
}

export function topicLabel(slug: string): string {
  return slug.replace(/-/g, ' ')
}

/**
 * Pure: turns content into nodes and edges. Positions are zero here; see layout.ts.
 * Nodes are sorted by id so the output (and therefore the layout) is deterministic.
 */
export function buildGraph(ideas: IdeaInput[], cv: CvInput | null): Graph {
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const topicCounts = new Map<string, number>()

  const add = (n: Omit<GraphNode, 'x' | 'y' | 'degree'>) => nodes.set(n.id, { ...n, x: 0, y: 0, degree: 0 })

  for (const idea of ideas) for (const t of idea.topics) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1)
  for (const item of [...(cv?.experience ?? []), ...(cv?.skills ?? [])])
    for (const t of item.topics) if (!topicCounts.has(t)) topicCounts.set(t, 0)

  for (const [topic, count] of topicCounts) {
    add({
      id: `topic:${topic}`,
      kind: 'topic',
      label: topicLabel(topic),
      caption: `${count} ${count === 1 ? 'idea' : 'ideas'}`,
      href: `/topics/${topic}`,
      r: Math.min(22, 13 + count * 2),
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
    for (const t of idea.topics) edges.push({ source: `idea:${idea.slug}`, target: `topic:${t}`, type: 'topic' })
  }

  // Ideas that share two or more topics are drawn as related (dashed).
  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const shared = ideas[i]!.topics.filter(t => ideas[j]!.topics.includes(t))
      if (shared.length >= 2)
        edges.push({ source: `idea:${ideas[i]!.slug}`, target: `idea:${ideas[j]!.slug}`, type: 'related' })
    }
  }

  if (cv) {
    add({ id: 'cv:root', kind: 'cv', label: 'CV', caption: 'curriculum vitae', href: '/cv', r: 9 })
    for (const e of cv.experience) {
      add({ id: `cv:${e.id}`, kind: 'cv', label: `${e.role}, ${e.org}`, caption: 'experience', href: `/cv#${e.id}`, r: 4.5 })
      edges.push({ source: `cv:${e.id}`, target: 'cv:root', type: 'cv' })
      for (const t of e.topics) edges.push({ source: `cv:${e.id}`, target: `topic:${t}`, type: 'cv-topic' })
    }
    for (const s of cv.skills) {
      add({ id: `cv:${s.id}`, kind: 'cv', label: s.group, caption: 'skills', href: `/cv#${s.id}`, r: 4.5 })
      edges.push({ source: `cv:${s.id}`, target: 'cv:root', type: 'cv' })
      for (const t of s.topics) edges.push({ source: `cv:${s.id}`, target: `topic:${t}`, type: 'cv-topic' })
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
