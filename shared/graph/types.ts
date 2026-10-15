export type NodeKind = 'topic' | 'idea' | 'cv'
export type EdgeType = 'topic' | 'related' | 'cv' | 'cv-topic'

export interface IdeaInput {
  slug: string
  title: string
  summary: string
  /** ISO date, e.g. 2026-09-12 */
  date: string
  topics: string[]
  kind?: string
  maturity?: string
}

export interface CvInput {
  experience: { id: string; role: string; org: string; topics: string[] }[]
  skills: { id: string; group: string; topics: string[] }[]
}

export interface GraphNode {
  id: string
  kind: NodeKind
  label: string
  /** secondary line for captions, e.g. "12 Sep 2026 · research" */
  caption: string
  href: string
  /** radius (circles) or half-size (squares) in viewBox units */
  r: number
  /** number of connections, used for screen-reader names */
  degree: number
  x: number
  y: number
}

export interface GraphEdge {
  source: string
  target: string
  type: EdgeType
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface LaidOutGraph extends Graph {
  width: number
  height: number
}
