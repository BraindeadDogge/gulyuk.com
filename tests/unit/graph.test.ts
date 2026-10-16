import { describe, expect, it } from 'vitest'
import { buildGraph, formatDate } from '../../shared/graph/build-graph'
import { layoutGraph, VIEW_H, VIEW_W } from '../../shared/graph/layout'
import type { CvInput, IdeaInput } from '../../shared/graph/types'

const ideas: IdeaInput[] = [
  { slug: 'a', title: 'A', summary: 's', date: '2026-09-12', area: 'ai', topics: ['ml-fundamentals', 'math'], kind: 'research' },
  { slug: 'b', title: 'B', summary: 's', date: '2026-08-01', area: 'ai', topics: ['ml-fundamentals', 'math', 'explainers'], kind: 'note' },
  { slug: 'c', title: 'C', summary: 's', date: '2026-07-04', area: 'engineering', topics: ['math'], kind: 'project' },
  { slug: 'd', title: 'D', summary: 's', date: '2026-06-04', area: 'life', topics: [], kind: 'note' },
]
const cv: CvInput = {
  experience: [{ id: 'exp-1', role: 'Engineer', org: 'Org', areas: ['engineering', 'startups'] }],
  skills: [{ id: 'skills-1', group: 'Languages', areas: ['engineering'] }],
}
const labels = { ai: 'AI & ML', engineering: 'Engineering', life: 'Life', startups: 'Startups' }

describe('buildGraph', () => {
  it('makes one hub per area that is used, and one node per idea', () => {
    const g = buildGraph(ideas, cv, labels)
    expect(g.nodes.filter(n => n.kind === 'topic').map(n => n.id)).toEqual(['topic:ai', 'topic:engineering', 'topic:life', 'topic:startups'])
    expect(g.nodes.filter(n => n.kind === 'idea')).toHaveLength(4)
    expect(g.nodes.some(n => n.id === 'cv:root')).toBe(true)
  })

  it('uses the vocabulary labels for hubs and falls back to the id', () => {
    const labelled = buildGraph(ideas, null, labels).nodes.find(n => n.id === 'topic:ai')!
    expect(labelled.label).toBe('AI & ML')
    const plain = buildGraph(ideas, null).nodes.find(n => n.id === 'topic:ai')!
    expect(plain.label).toBe('ai')
  })

  it('never turns topics into nodes: however many topics there are, the hubs stay the areas', () => {
    const many = ideas.map(i => ({ ...i, topics: ['ml-fundamentals', 'math', 'explainers'] }))
    const g = buildGraph(many, null, labels)
    expect(g.nodes.filter(n => n.kind === 'topic')).toHaveLength(3)
  })

  it('attaches each idea to its own area only', () => {
    const g = buildGraph(ideas, null, labels)
    const toArea = g.edges.filter(e => e.type === 'topic')
    expect(toArea).toHaveLength(ideas.length)
    expect(toArea.find(e => e.source === 'idea:c')!.target).toBe('topic:engineering')
  })

  it('connects every node (no orphans)', () => {
    const g = buildGraph(ideas, cv, labels)
    for (const n of g.nodes) expect(n.degree, n.id).toBeGreaterThan(0)
  })

  it('relates ideas only where the areas do not already say so', () => {
    const g = buildGraph(ideas, null, labels)
    const related = g.edges.filter(e => e.type === 'related').map(e => `${e.source}>${e.target}`)
    // a and b: same area, two shared topics. c shares "math" with both, across areas. d shares nothing.
    expect(related).toEqual(['idea:a>idea:b', 'idea:a>idea:c', 'idea:b>idea:c'])
  })

  it('does not relate same-area ideas that share a single topic', () => {
    const two: IdeaInput[] = [
      { slug: 'x', title: 'X', summary: 's', date: '2026-01-01', area: 'ai', topics: ['math'] },
      { slug: 'y', title: 'Y', summary: 's', date: '2026-01-02', area: 'ai', topics: ['math'] },
    ]
    expect(buildGraph(two, null).edges.filter(e => e.type === 'related')).toEqual([])
  })

  it('is deterministic regardless of input order', () => {
    const a = buildGraph(ideas, cv, labels)
    const b = buildGraph([...ideas].reverse(), cv, labels)
    expect(b.nodes.map(n => n.id)).toEqual(a.nodes.map(n => n.id))
  })

  it('handles empty content', () => {
    expect(buildGraph([], null)).toEqual({ nodes: [], edges: [] })
    expect(layoutGraph(buildGraph([], null)).nodes).toEqual([])
  })

  it('formats dates without timezone drift', () => {
    expect(formatDate('2026-09-01')).toBe('1 Sep 2026')
    expect(formatDate('2026-12-31T23:59:00.000Z')).toBe('31 Dec 2026')
  })
})

describe('layoutGraph', () => {
  it('produces identical output on repeated runs', () => {
    const g = buildGraph(ideas, cv, labels)
    expect(layoutGraph(g)).toEqual(layoutGraph(g))
  })

  it('keeps nodes inside the viewBox and at least 24 units apart', () => {
    const l = layoutGraph(buildGraph(ideas, cv, labels))
    for (const n of l.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0)
      expect(n.x).toBeLessThanOrEqual(VIEW_W)
      expect(n.y).toBeGreaterThanOrEqual(0)
      expect(n.y).toBeLessThanOrEqual(VIEW_H)
    }
    for (let i = 0; i < l.nodes.length; i++)
      for (let j = i + 1; j < l.nodes.length; j++)
        expect(Math.hypot(l.nodes[i]!.x - l.nodes[j]!.x, l.nodes[i]!.y - l.nodes[j]!.y)).toBeGreaterThanOrEqual(24)
  })
})
