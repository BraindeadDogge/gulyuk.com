export type NodeKind = 'topic' | 'idea' | 'cv'
export type EdgeType = 'topic' | 'related' | 'cv' | 'cv-topic'

export interface IdeaInput {
  slug: string
  title: string
  summary: string
  /** ISO date, e.g. 2026-09-12 */
  date: string
  /** The one area this idea belongs to (an id from content/taxonomy.yml). It becomes the idea's hub. */
  area: string
  /** Up to three topic ids from content/taxonomy.yml. They are tags, never graph nodes. */
  topics: string[]
  kind?: string
  maturity?: string
}

export interface CvInput {
  experience: { id: string; role: string; org: string; areas: string[] }[]
  skills: { id: string; group: string; areas: string[] }[]
}

export interface GraphNode {
  id: string
  /** 'topic' is the hub kind: since areas replaced free tags, these nodes are the areas. */
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
