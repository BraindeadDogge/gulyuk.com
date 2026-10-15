<script setup lang="ts">
import { forceCollide, forceLink, forceSimulation, type Simulation } from 'd3-force'
import type { GraphNode, LaidOutGraph } from '~~/shared/graph/types'

const props = defineProps<{
  graph: LaidOutGraph
  activeId: string | null
  paused: boolean
  alwaysLabel: string[]
}>()
const emit = defineEmits<{ hover: [id: string | null]; fail: [error: unknown] }>()

const nodeById = new Map(props.graph.nodes.map(n => [n.id, n]))

const edges = computed(() =>
  props.graph.edges
    .map(e => ({ ...e, key: `${e.source}|${e.target}`, a: nodeById.get(e.source)!, b: nodeById.get(e.target)! }))
    .filter(e => e.a && e.b),
)

const adjacency = computed(() => {
  const map = new Map<string, Set<string>>()
  for (const e of props.graph.edges) {
    if (!map.has(e.source)) map.set(e.source, new Set())
    if (!map.has(e.target)) map.set(e.target, new Set())
    map.get(e.source)!.add(e.target)
    map.get(e.target)!.add(e.source)
  }
  return map
})

/** Hop distance from the hovered node: dimming spreads outward as a short wave. */
const hops = computed(() => {
  const out = new Map<string, number>()
  if (!props.activeId) return out
  out.set(props.activeId, 0)
  const queue = [props.activeId]
  while (queue.length) {
    const id = queue.shift()!
    for (const next of adjacency.value.get(id) ?? []) {
      if (!out.has(next)) {
        out.set(next, out.get(id)! + 1)
        queue.push(next)
      }
    }
  }
  return out
})

function isNear(id: string) {
  return !!props.activeId && (id === props.activeId || adjacency.value.get(props.activeId)?.has(id) === true)
}
function nodeClass(n: GraphNode) {
  return [
    `node--${n.kind}`,
    { 'is-active': n.id === props.activeId, 'is-near': isNear(n.id), 'is-dim': !!props.activeId && !isNear(n.id) },
  ]
}
function edgeClass(e: { type: string; source: string; target: string }) {
  const lit = !!props.activeId && (e.source === props.activeId || e.target === props.activeId)
  return [`edge--${e.type}`, { 'is-lit': lit, 'is-dim': !!props.activeId && !lit }]
}
function showLabel(n: GraphNode) {
  return n.kind === 'topic' || n.id === 'cv:root' || props.alwaysLabel.includes(n.id) || isNear(n.id)
}
/** Long titles are shortened until the node is hovered, so resting labels don't collide. */
function labelText(n: GraphNode) {
  if (n.kind !== 'idea' || isNear(n.id) || n.label.length <= 26) return n.label
  return `${n.label.slice(0, 25).trimEnd()}…`
}
function labelAttrs(n: GraphNode) {
  if (n.kind === 'topic') return { x: 0, y: n.r + 18, 'text-anchor': 'middle' }
  const flip = n.x > props.graph.width - 260
  return { x: flip ? -(n.r + 10) : n.r + 10, y: 4, 'text-anchor': flip ? 'end' : 'start' }
}

// ---------- client-only physics ----------
const svg = ref<SVGSVGElement>()
const nodeEls = new Map<string, SVGAElement>()
const lineEls: (SVGLineElement | null)[] = []
const pulse = ref<{ x: number; y: number; r: number; key: number } | null>(null)

interface SimNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  hx: number
  hy: number
  fx: number | null
  fy: number | null
  r: number
}

let sim: Simulation<SimNode, undefined> | undefined
let simNodes: SimNode[] = []
let raf = 0
let pulseTimer: ReturnType<typeof setInterval> | undefined
let visible = true
let clock = 0
const pointer = { x: 0, y: 0, inside: false }
let drag: { node: SimNode; startX: number; startY: number; moved: boolean } | null = null
let suppressClick = false
let observers: (() => void)[] = []

function running() {
  return !!sim && !props.paused && visible && !document.hidden
}

function paint() {
  for (const n of simNodes) nodeEls.get(n.id)?.setAttribute('transform', `translate(${n.x.toFixed(2)} ${n.y.toFixed(2)})`)
  const index = new Map(simNodes.map(n => [n.id, n]))
  edges.value.forEach((e, i) => {
    const a = index.get(e.source)
    const b = index.get(e.target)
    const line = lineEls[i]
    if (!a || !b || !line) return
    line.setAttribute('x1', a.x.toFixed(2))
    line.setAttribute('y1', a.y.toFixed(2))
    line.setAttribute('x2', b.x.toFixed(2))
    line.setAttribute('y2', b.y.toFixed(2))
  })
}

function frame() {
  raf = 0
  if (!running()) return
  clock += 0.016
  sim!.tick()
  paint()
  raf = requestAnimationFrame(frame)
}

function syncLoop() {
  if (running() && !raf) raf = requestAnimationFrame(frame)
  if (!running() && raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
  clearInterval(pulseTimer)
  if (running()) pulseTimer = setInterval(firePulse, 6000)
}

function snapHome() {
  for (const n of simNodes) {
    n.x = n.hx
    n.y = n.hy
    n.vx = n.vy = 0
    n.fx = n.fy = null
  }
  paint()
}

function firePulse() {
  const hubs = simNodes.filter(n => n.id.startsWith('topic:'))
  if (!hubs.length) return
  const hub = hubs[Math.floor(Math.random() * hubs.length)]!
  pulse.value = { x: hub.hx, y: hub.hy, r: hub.r, key: Date.now() }
  setTimeout(() => (pulse.value = null), 1800)
}

function toSvgPoint(clientX: number, clientY: number) {
  const el = svg.value!
  const ctm = el.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
  return { x: p.x, y: p.y }
}

function onMove(e: PointerEvent) {
  const p = toSvgPoint(e.clientX, e.clientY)
  pointer.x = p.x
  pointer.y = p.y
  pointer.inside = e.pointerType === 'mouse'
}
function onLeave() {
  pointer.inside = false
}

function onDown(e: PointerEvent, n: GraphNode) {
  if (props.paused || e.pointerType !== 'mouse' || e.button !== 0) return
  const node = simNodes.find(s => s.id === n.id)
  if (!node) return
  drag = { node, startX: e.clientX, startY: e.clientY, moved: false }
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd)
  window.addEventListener('pointercancel', onDragEnd)
}
function onDragMove(e: PointerEvent) {
  if (!drag) return
  if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) drag.moved = true
  if (drag.moved) {
    const p = toSvgPoint(e.clientX, e.clientY)
    drag.node.fx = p.x
    drag.node.fy = p.y
  }
}
function onDragEnd() {
  if (drag) {
    suppressClick = drag.moved
    drag.node.fx = drag.node.fy = null
    drag = null
  }
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
  window.removeEventListener('pointercancel', onDragEnd)
}
function onClick(e: MouseEvent, n: GraphNode) {
  if (suppressClick) {
    e.preventDefault()
    suppressClick = false
    return
  }
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  e.preventDefault()
  navigateTo(n.href)
}

function setup() {
  const graph = props.graph
  simNodes = graph.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, vx: 0, vy: 0, hx: n.x, hy: n.y, fx: null, fy: null, r: n.r }))
  const byId = new Map(simNodes.map(n => [n.id, n]))
  const links = graph.edges
    .filter(e => byId.has(e.source) && byId.has(e.target))
    .map(e => ({ source: e.source, target: e.target }))
  // Link distances equal the laid-out distances, so the layout is the rest state.
  const rest = (l: { source: string | SimNode; target: string | SimNode }) => {
    const a = byId.get(typeof l.source === 'string' ? l.source : l.source.id)!
    const b = byId.get(typeof l.target === 'string' ? l.target : l.target.id)!
    return Math.hypot(a.hx - b.hx, a.hy - b.hy)
  }

  sim = forceSimulation<SimNode>(simNodes)
    .alpha(1)
    .alphaDecay(0)
    .alphaTarget(1)
    .velocityDecay(0.3)
    .force('link', forceLink<SimNode, { source: string; target: string }>(links).id(d => d.id).distance(rest).strength(0.08))
    .force('collide', forceCollide<SimNode>().radius(d => d.r + 8).strength(0.6))
    .force('home-and-life', () => {
      simNodes.forEach((n, i) => {
        // Spring back to the laid-out position (this is the release after a drag).
        n.vx += (n.hx - n.x) * 0.05
        n.vy += (n.hy - n.y) * 0.05
        // Breathing: a slow, tiny, per-node wobble.
        n.vx += Math.sin(clock * 0.7 + i * 1.7) * 0.07
        n.vy += Math.cos(clock * 0.5 + i * 2.3) * 0.07
        // The cursor leans nearby nodes toward itself.
        if (pointer.inside && !drag) {
          const dx = pointer.x - n.x
          const dy = pointer.y - n.y
          const d = Math.hypot(dx, dy)
          if (d > 1 && d < 190) {
            const pull = 0.22 * (1 - d / 190)
            n.vx += (dx / d) * pull
            n.vy += (dy / d) * pull
          }
        }
      })
    })
    .stop()
}

onMounted(() => {
  try {
    setup()

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
      syncLoop()
    })
    io.observe(svg.value!)
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? props.graph.width
      const h = entry?.contentRect.height ?? props.graph.height
      // The viewBox is letterboxed, so the drawn scale is the smaller of the two ratios.
      const k = Math.min(w / props.graph.width, h / props.graph.height)
      svg.value?.style.setProperty('--k', String(Math.max(0.2, k)))
    })
    ro.observe(svg.value!)
    const onVisibility = () => syncLoop()
    document.addEventListener('visibilitychange', onVisibility)
    observers = [() => io.disconnect(), () => ro.disconnect(), () => document.removeEventListener('visibilitychange', onVisibility)]

    watch(() => props.paused, (paused) => {
      if (paused) snapHome()
      syncLoop()
    })
    syncLoop()
  } catch (error) {
    emit('fail', error)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearInterval(pulseTimer)
  observers.forEach(off => off())
  sim?.stop()
  onDragEnd()
})
</script>

<template>
  <svg
    ref="svg"
    class="graph"
    :viewBox="`0 0 ${graph.width} ${graph.height}`"
    aria-hidden="true"
    focusable="false"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <g class="edges">
      <line
        v-for="(e, i) in edges"
        :key="e.key"
        :ref="(el) => (lineEls[i] = el as SVGLineElement | null)"
        class="edge"
        :class="edgeClass(e)"
        :x1="e.a.x"
        :y1="e.a.y"
        :x2="e.b.x"
        :y2="e.b.y"
      />
    </g>

    <circle v-if="pulse" :key="pulse.key" class="pulse" :cx="pulse.x" :cy="pulse.y" :r="pulse.r + 4" />

    <g class="nodes">
      <a
        v-for="n in graph.nodes"
        :key="n.id"
        :ref="(el) => { if (el) nodeEls.set(n.id, el as SVGAElement) }"
        :href="n.href"
        tabindex="-1"
        class="node"
        :class="nodeClass(n)"
        :style="{ '--hop': hops.get(n.id) ?? 0 }"
        :transform="`translate(${n.x} ${n.y})`"
        @pointerenter="emit('hover', n.id)"
        @pointerleave="emit('hover', null)"
        @pointerdown="onDown($event, n)"
        @click="onClick($event, n)"
      >
        <circle class="hit" :r="Math.max(n.r + 10, 20)" />
        <g class="body">
          <circle v-if="n.kind === 'topic'" class="shape shape--hub" :r="n.r" />
          <circle v-else-if="n.kind === 'idea'" class="shape shape--idea" :r="n.r" />
          <rect v-else class="shape shape--cv" :x="-n.r" :y="-n.r" :width="n.r * 2" :height="n.r * 2" />
        </g>
        <text v-if="showLabel(n)" class="glabel" :class="`glabel--${n.kind}`" v-bind="labelAttrs(n)">{{ labelText(n) }}</text>
      </a>
    </g>
  </svg>
</template>

<style scoped>
.graph {
  display: block;
  width: 100%;
  /* Fit the first screen: the graph, the intro line and the controls are all visible at once. */
  height: clamp(24rem, calc(100svh - 14.5rem), 50rem);
  overflow: visible;
  --k: 1;
}

.edge {
  stroke: var(--edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transition: stroke var(--t-mid) var(--ease-out), opacity var(--t-mid) var(--ease-out);
}
.edge--related { stroke-dasharray: 2 4; }
/* CV-to-topic links are secondary: they only appear when you hover one of their ends. */
.edge--cv-topic { stroke-dasharray: 1 5; stroke-opacity: 0; }
.edge--cv-topic.is-lit { stroke-opacity: 1; }
.edge.is-lit { stroke: var(--accent); }
.edge.is-dim { opacity: 0.25; }

.node {
  cursor: pointer;
  outline: none;
  transition: opacity var(--t-mid) var(--ease-out);
}
.node.is-dim {
  opacity: 0.5;
  transition-delay: calc(var(--hop, 1) * 30ms);
}
.hit { fill: transparent; }

.body {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform var(--t-mid) var(--ease-out);
}
.node.is-active .body { transform: scale(1.25); }

.shape { transition: fill var(--t-fast) var(--ease-out), stroke var(--t-fast) var(--ease-out); }
.shape--hub { fill: var(--ink); }
.shape--idea { fill: var(--bg); stroke: var(--ink); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.shape--cv { fill: var(--muted); }
.node.is-active .shape--hub,
.node.is-active .shape--cv { fill: var(--accent); }
.node.is-active .shape--idea { stroke: var(--accent); }

.glabel {
  font: 500 calc(14px / var(--k)) var(--font-ui);
  fill: var(--ink);
  paint-order: stroke;
  stroke: var(--bg);
  stroke-width: calc(5px / var(--k));
  stroke-linejoin: round;
  pointer-events: none;
}
.glabel--topic { font-weight: 600; letter-spacing: -0.005em; }
.glabel--cv { fill: var(--muted); }
.node.is-active .glabel { fill: var(--accent); }

.pulse {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center;
  animation: pulse 1.6s var(--ease-out) forwards;
  pointer-events: none;
}
@keyframes pulse {
  from { transform: scale(1); opacity: 0.7; }
  to { transform: scale(2.4); opacity: 0; }
}

@media (forced-colors: active) {
  .shape--hub, .shape--cv { fill: CanvasText; }
  .shape--idea { fill: Canvas; stroke: CanvasText; }
  .edge { stroke: GrayText; }
  .glabel { fill: CanvasText; stroke: Canvas; }
}
</style>
