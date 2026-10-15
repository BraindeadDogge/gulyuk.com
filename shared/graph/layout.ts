import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force'
import type { Graph, LaidOutGraph } from './types'

export const VIEW_W = 1200
export const VIEW_H = 760
const PAD = 90

/** Small seeded PRNG so d3's jiggle (used for coincident points) is repeatable. */
function lcg(seed = 7) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

interface SimNode {
  id: string
  kind: string
  r: number
  x: number
  y: number
}

/**
 * Deterministic force layout. Runs a fixed number of synchronous ticks and returns settled,
 * rounded coordinates fitted into the viewBox, so server and client render identical markup.
 */
export function layoutGraph(graph: Graph, seed = 7): LaidOutGraph {
  const nodes: SimNode[] = graph.nodes.map((n, i) => {
    // Seed on a golden-angle spiral: deterministic and well spread.
    const a = i * 2.399963
    const d = 40 * Math.sqrt(i + 1)
    return { id: n.id, kind: n.kind, r: n.r, x: Math.cos(a) * d, y: Math.sin(a) * d }
  })
  const byId = new Map(nodes.map(n => [n.id, n]))
  const links = graph.edges
    .filter(e => byId.has(e.source) && byId.has(e.target))
    .map(e => ({ source: e.source, target: e.target, type: e.type }))

  const sim = forceSimulation(nodes)
    .randomSource(lcg(seed))
    .force(
      'link',
      forceLink<SimNode, { source: string; target: string; type: string }>(links)
        .id(d => d.id)
        .distance(l => (l.type === 'related' ? 190 : l.type === 'cv' ? 64 : l.type === 'cv-topic' ? 260 : 125))
        .strength(l => (l.type === 'related' ? 0.04 : l.type === 'cv-topic' ? 0.015 : 0.45)),
    )
    .force('charge', forceManyBody<SimNode>().strength(d => (d.kind === 'topic' ? -720 : d.kind === 'idea' ? -260 : -70)))
    .force('collide', forceCollide<SimNode>().radius(d => d.r + (d.kind === 'topic' ? 38 : d.kind === 'idea' ? 34 : 16)).iterations(3))
    .force('x', forceX<SimNode>(d => (d.kind === 'cv' ? 380 : 0)).strength(d => (d.kind === 'cv' ? 0.1 : 0.035)))
    .force('y', forceY<SimNode>(d => (d.kind === 'cv' ? 230 : 0)).strength(d => (d.kind === 'cv' ? 0.1 : 0.05)))
    .stop()

  for (let i = 0; i < 420; i++) sim.tick()

  // Fit into the viewBox.
  const xs = nodes.map(n => n.x)
  const ys = nodes.map(n => n.y)
  const minX = Math.min(...xs, 0)
  const maxX = Math.max(...xs, 1)
  const minY = Math.min(...ys, 0)
  const maxY = Math.max(...ys, 1)
  const scale = Math.min(2.4, Math.max(0.6, Math.min((VIEW_W - 2 * PAD) / (maxX - minX || 1), (VIEW_H - 2 * PAD) / (maxY - minY || 1))))
  const offX = (VIEW_W - (maxX - minX) * scale) / 2 - minX * scale
  const offY = (VIEW_H - (maxY - minY) * scale) / 2 - minY * scale
  const round = (v: number) => Math.round(v * 10) / 10

  return {
    width: VIEW_W,
    height: VIEW_H,
    edges: graph.edges,
    nodes: graph.nodes.map((n, i) => ({ ...n, x: round(nodes[i]!.x * scale + offX), y: round(nodes[i]!.y * scale + offY) })),
  }
}
