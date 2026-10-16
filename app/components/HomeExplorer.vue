<script setup lang="ts">
import type { LaidOutGraph } from '~~/shared/graph/types'
import type { TopicGroup } from '~/composables/useSiteData'

defineProps<{
  graph: LaidOutGraph
  groups: TopicGroup[]
  newest: string[]
  count: { ideas: number; topics: number }
}>()

type View = 'graph' | 'list'

const VIEW_KEY = 'gulyuk-view'
const MOTION_KEY = 'gulyuk-motion'
const WIDE = '(min-width: 760px)'

// The saved view is applied before first paint by the head script in nuxt.config.ts.
const graphShown = ref(true)
const paused = ref(false)
const activeId = ref<string | null>(null)
const status = ref('')
const switching = ref<'out' | 'in' | null>(null)
const entering = ref(false)
let statusTimer: ReturnType<typeof setTimeout> | undefined
let media: MediaQueryList | undefined

function read(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* private mode: the choice just won't persist */ }
}

function currentView(): View {
  const forced = document.documentElement.dataset.view
  if (forced === 'graph' || forced === 'list') return forced
  return media?.matches ? 'graph' : 'list'
}
function refreshShown() {
  graphShown.value = currentView() === 'graph'
}
function say(text: string, ms = 6000) {
  status.value = text
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => (status.value = ''), ms)
}
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

async function setView(next: View) {
  const animate = !reduced()
  if (animate) {
    switching.value = 'out'
    await wait(next === 'list' ? 480 : 260)
  }
  document.documentElement.dataset.view = next
  write(VIEW_KEY, next)
  refreshShown()
  activeId.value = null
  if (animate) {
    switching.value = null
    if (next === 'list') {
      entering.value = true
      setTimeout(() => (entering.value = false), 1200)
    } else {
      switching.value = 'in'
      setTimeout(() => (switching.value = null), 500)
    }
  }
  say(next === 'list' ? 'ok. boring.' : 'there it is again.')
}

function toggleView() {
  setView(graphShown.value ? 'list' : 'graph')
}

function toggleMotion() {
  paused.value = !paused.value
  write(MOTION_KEY, paused.value ? 'paused' : 'running')
  say(paused.value ? 'motion paused' : 'motion on', 3000)
}

function onGraphFail(error: unknown) {
  console.error('graph failed, falling back to the list', error)
  document.documentElement.dataset.view = 'list'
  refreshShown()
  say('the graph broke, so here is the plain list.', 10000)
}

// Keyboard and screen-reader users move through the list; focus lights up the matching node.
function onFocusIn(e: FocusEvent) {
  const id = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-node]')?.dataset.node
  if (id) activeId.value = id
}
function onFocusOut() {
  activeId.value = null
}

onMounted(() => {
  media = window.matchMedia(WIDE)
  media.addEventListener('change', refreshShown)
  const saved = read(MOTION_KEY)
  paused.value = saved ? saved === 'paused' : reduced()
  // Safety net for client-side arrivals if the head script did not run.
  const view = read(VIEW_KEY)
  // A saved choice only applies on screens wide enough for the graph.
  if (!document.documentElement.dataset.view && innerWidth >= 760 && (view === 'graph' || view === 'list')) document.documentElement.dataset.view = view
  refreshShown()
})
onBeforeUnmount(() => {
  media?.removeEventListener('change', refreshShown)
  clearTimeout(statusTimer)
})
</script>

<template>
  <div class="explorer" :class="{ 'is-entering': entering, 'is-leaving': switching === 'out', 'is-arriving': switching === 'in' }">
    <!-- Visible in the list view and on phones; visually hidden when the graph is the page. -->
    <div class="title-block">
      <h1>Grigory Gulyuk<span class="visually-hidden">: notes, experiments and CV</span></h1>
      <p class="blurb">Software engineer. Notes, experiments and a CV.</p>
    </div>

    <section id="graph-panel" class="graph-panel" aria-label="Map of ideas, topics and CV">
      <GraphView
        :graph="graph"
        :active-id="activeId"
        :paused="paused"
        :always-label="newest"
        @hover="activeId = $event"
        @fail="onGraphFail"
      />
    </section>

    <div id="list-panel" class="list-panel" @focusin="onFocusIn" @focusout="onFocusOut">
      <ClassicNav :groups="groups" />
    </div>

    <footer class="stage-footer">
      <div class="intro">
        <div class="graph-only">
          <p class="blurb">Notes, experiments and a CV. Every shape is a page.</p>
          <p class="mono muted legend">
            <span class="key"><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" class="k-hub" /></svg>topic</span>
            <span class="key"><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4.5" class="k-idea" /></svg>idea</span>
            <span class="key"><svg viewBox="0 0 14 14" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" class="k-cv" /></svg>cv</span>
            <span class="key"><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="3" class="k-new" /></svg>newest</span>
            <span class="count">{{ count.ideas }} ideas · {{ count.topics }} topics</span>
          </p>
          <p class="mono muted hint">Hover to trace connections. Drag to rearrange. Keyboard and screen readers: the list of every page opens as you tab.</p>
        </div>
      </div>

      <ClientOnly>
        <div class="controls no-print">
          <span class="status-line mono muted" aria-hidden="true">{{ status }}</span>
          <button v-if="graphShown" type="button" class="ctl" :aria-pressed="paused" @click="toggleMotion">
            pause motion
          </button>
          <button
            type="button"
            class="ctl ctl--main"
            aria-describedby="view-toggle-help"
            aria-controls="graph-panel list-panel"
            @click="toggleView"
          >
            {{ graphShown ? 'make everything boring' : 'make it interesting again' }}
          </button>
          <span id="view-toggle-help" class="visually-hidden">Switches between the interactive graph and a plain list of the same pages.</span>
        </div>
      </ClientOnly>
    </footer>

    <p class="visually-hidden" role="status" aria-live="polite">{{ status }}</p>
  </div>
</template>

<style scoped>
.explorer {
  --hidden-clip: inset(50%);
  position: relative;
  width: 100%;
  max-width: 82rem;
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* ---- Which view is shown: CSS decides, so there is no flash and no hydration mismatch ---- */
.graph-panel { display: none; }
.list-panel { display: block; }

@media (min-width: 760px) {
  .graph-panel { display: block; }
  .list-panel {
    position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
}
html[data-view='graph'] .graph-panel { display: block; }
html[data-view='graph'] .list-panel {
  position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
html[data-view='list'] .graph-panel { display: none; }
html[data-view='list'] .list-panel {
  position: static; width: auto; height: auto; margin: 0; overflow: visible; clip-path: none; white-space: normal;
}
/* Keyboard users tabbing through the (visually hidden) list must see where focus is. */
.explorer .list-panel:focus-within {
  position: static; width: auto; height: auto; margin: 0; overflow: visible; clip-path: none; white-space: normal;
}

.graph-panel {
  min-height: 24rem;
  padding: 0.5rem 0 0;
}

/* ---- Switching animation: edges let go, shapes shrink, then the other view arrives ---- */
.is-leaving :deep(.edge) { opacity: 0 !important; transition: opacity 300ms var(--ease-in-out); }
.is-leaving :deep(.body) { transform: scale(0.15) !important; transition: transform var(--t-sig) var(--ease-in-out); }
.is-leaving :deep(.glabel) { opacity: 0; transition: opacity 260ms var(--ease-in-out); }
.is-arriving :deep(.edge) { animation: fade-in var(--t-slow) var(--ease-out) both; }
.is-arriving :deep(.body) { animation: grow var(--t-slow) var(--spring) both; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes grow { from { transform: scale(0.15); } to { transform: scale(1); } }

/* ---- Footer strip under the stage ---- */
.stage-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem 2rem;
  padding: 1rem 0 0;
}
.intro { max-width: 46rem; }
.blurb { margin: 0; font-style: italic; font-size: 1.25rem; line-height: 1.4; }
.legend { display: flex; flex-wrap: wrap; gap: 0.4rem 1.1rem; margin: 0.6rem 0 0; }
.key { display: inline-flex; align-items: center; gap: 0.4rem; }
.key svg { width: 0.9rem; height: 0.9rem; }
.k-hub { fill: var(--ink); }
.k-idea { fill: var(--bg); stroke: var(--ink); stroke-width: 1.5; }
.k-cv { fill: var(--muted); }
.count { margin-left: 0.4rem; }
.hint { margin: 0.4rem 0 0; max-width: 60ch; }

.controls { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ctl {
  font: 500 0.9rem var(--font-mono);
  padding: 0.55rem 0.9rem;
  min-height: 2.5rem;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--ink);
  border-radius: 2px;
  cursor: pointer;
  transition: background-color var(--t-fast) var(--ease-out), color var(--t-fast) var(--ease-out), border-color var(--t-fast) var(--ease-out);
}
.ctl:hover { border-color: var(--accent); color: var(--accent); }
.ctl--main { font-weight: 700; }
.ctl--main::after { content: ' →' / ''; }
.ctl[aria-pressed='true'] { border-style: dashed; }

.controls { align-items: center; }
.status-line { min-width: 12ch; text-align: right; }
.status-line:not(:empty)::before { content: '> ' / ''; color: var(--accent); }

/* The title block is the list view's heading; the graph view keeps its h1 visually hidden. */
.title-block { padding: 1.5rem 0 0.5rem; }
.title-block .blurb { margin-top: 0.75rem; }
@media (min-width: 760px) {
  .title-block {
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
}
html[data-view='graph'] .title-block {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
html[data-view='list'] .title-block {
  position: static; width: auto; height: auto; margin: 0; padding: 1.5rem 0 0.5rem; overflow: visible; clip-path: none; white-space: normal;
}

/* Phones get the list only: a graph that small cannot be read or touched accurately. */
@media (max-width: 759px) {
  .controls { display: none; }
  .stage-footer { padding: 0; }
  .classic-gap { display: none; }
}

/* Legend and hint only belong with the graph: CSS follows the same view rules as the panels. */
.graph-only { display: none; }
@media (min-width: 760px) { .graph-only { display: block; } }
html[data-view='graph'] .graph-only { display: block; }
html[data-view='list'] .graph-only { display: none; }
.k-new { fill: var(--accent); }
</style>
