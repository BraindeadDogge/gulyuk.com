import { describe, expect, it } from 'vitest'
import { buildGraph, formatDate } from '../../shared/graph/build-graph'
import { layoutGraph, VIEW_H, VIEW_W } from '../../shared/graph/layout'
import type { CvInput, IdeaInput } from '../../shared/graph/types'

const ideas: IdeaInput[] = [
  { slug: 'a', title: 'A', summary: 's', date: '2026-09-12', topics: ['ml', 'math'], kind: 'research' },
  { slug: 'b', title: 'B', summary: 's', date: '2026-08-01', topics: ['ml', 'math', 'tools'], kind: 'note' },
  { slug: 'c', title: 'C', summary: 's', date: '2026-07-04', topics: ['tools'], kind: 'project' },
]
const cv: CvInput = {
  experience: [{ id: 'exp-1', role: 'Engineer', org: 'Org', topics: ['ml'] }],
  skills: [{ id: 'skills-1', group: 'Languages', topics: ['tools'] }],
}

describe('buildGraph', () => {
  it('creates one hub per topic and one node per idea', () => {
    const g = buildGraph(ideas, cv)
    expect(g.nodes.filter(n => n.kind === 'topic').map(n => n.id)).toEqual(['topic:math', 'topic:ml', 'topic:tools'])
    expect(g.nodes.filter(n => n.kind === 'idea')).toHaveLength(3)
    expect(g.nodes.some(n => n.id === 'cv:root')).toBe(true)
  })

  it('connects every node (no orphans)', () => {
    const g = buildGraph(ideas, cv)
    for (const n of g.nodes) expect(n.degree, n.id).toBeGreaterThan(0)
  })

  it('draws related edges only for two or more shared topics', () => {
    const g = buildGraph(ideas, null)
    const related = g.edges.filter(e => e.type === 'related')
    expect(related).toEqual([{ source: 'idea:a', target: 'idea:b', type: 'related' }])
  })

  it('is deterministic regardless of input order', () => {
    const a = buildGraph(ideas, cv)
    const b = buildGraph([...ideas].reverse(), cv)
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
    const g = buildGraph(ideas, cv)
    expect(layoutGraph(g)).toEqual(layoutGraph(g))
  })

  it('keeps nodes inside the viewBox and at least 24 units apart', () => {
    const l = layoutGraph(buildGraph(ideas, cv))
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
