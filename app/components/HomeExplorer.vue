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
  if (!document.documentElement.dataset.view && (view === 'graph' || view === 'list')) document.documentElement.dataset.view = view
  refreshShown()
})
onBeforeUnmount(() => {
  media?.removeEventListener('change', refreshShown)
  clearTimeout(statusTimer)
})
</script>

<template>
  <div class="explorer" :class="{ 'is-entering': entering, 'is-leaving': switching === 'out', 'is-arriving': switching === 'in' }">
    <h1 class="visually-hidden">Grigory Gulyuk: notes, experiments and CV</h1>

    <section class="graph-panel" aria-label="Map of ideas, topics and CV">
      <GraphView
        :graph="graph"
        :active-id="activeId"
        :paused="paused"
        :always-label="newest"
        @hover="activeId = $event"
        @fail="onGraphFail"
      />
    </section>

    <div class="list-panel" @focusin="onFocusIn" @focusout="onFocusOut">
      <ClassicNav :groups="groups" />
    </div>

    <footer class="stage-footer">
      <div class="intro">
        <p class="blurb">Notes, experiments and a CV. Every shape is a page.</p>
        <p v-if="graphShown" class="mono muted legend">
          <span class="key"><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" class="k-hub" /></svg>topic</span>
          <span class="key"><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4.5" class="k-idea" /></svg>idea</span>
          <span class="key"><svg viewBox="0 0 14 14" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" class="k-cv" /></svg>cv</span>
          <span class="count">{{ count.ideas }} ideas · {{ count.topics }} topics</span>
        </p>
        <p v-if="graphShown" class="mono muted hint">Hover to trace connections. Drag to rearrange. Keyboard and screen readers: tab through the list.</p>
      </div>

      <ClientOnly>
        <div class="controls no-print">
          <button v-if="graphShown" type="button" class="ctl" :aria-pressed="paused" @click="toggleMotion">
            {{ paused ? 'resume motion' : 'pause motion' }}
          </button>
          <button type="button" class="ctl ctl--main" @click="toggleView">
            {{ graphShown ? 'make everything boring' : 'make it interesting again' }}
          </button>
        </div>
      </ClientOnly>
    </footer>

    <p class="toast mono" :class="{ 'is-on': !!status }" aria-hidden="true">{{ status }}</p>
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
.ctl--main { background: var(--ink); color: var(--bg); }
.ctl--main:hover { background: var(--accent); border-color: var(--accent); color: var(--bg); }
.ctl[aria-pressed='true'] { border-style: dashed; }

.toast {
  position: fixed;
  left: 50%;
  bottom: 1.25rem;
  margin: 0;
  padding: 0.5rem 0.9rem;
  background: var(--ink);
  color: var(--bg);
  border-radius: 2px;
  opacity: 0;
  transform: translate(-50%, 8px);
  pointer-events: none;
  transition: opacity var(--t-mid) var(--ease-out), transform var(--t-mid) var(--ease-out);
}
.toast.is-on { opacity: 1; transform: translate(-50%, 0); }
</style>
