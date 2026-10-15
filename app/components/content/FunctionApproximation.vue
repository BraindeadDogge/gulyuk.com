<script setup lang="ts">
// A one-hidden-layer tanh network, trained by full-batch gradient descent, in plain arithmetic.
type TargetKey = 'sine' | 'wiggle' | 'kink' | 'step'

const TARGETS: Record<TargetKey, { label: string; f: (x: number) => number }> = {
  sine: { label: 'sine', f: x => Math.sin(2 * x) },
  wiggle: { label: 'wiggle', f: x => 0.6 * Math.sin(3 * x) + 0.25 * x },
  kink: { label: 'kink', f: x => Math.abs(x) - 1.2 },
  step: { label: 'step', f: x => (x < 0.4 ? -0.8 : 0.8) },
}

const X0 = -3
const X1 = 3
const N = 64
const MAX_UNITS = 16
const STEPS_PER_FRAME = 8
const STEP_LIMIT = 6000
const W = 640
const H = 300
const PLOT = { left: 44, right: 624, mid: 150, scale: 88 }

const xs = Array.from({ length: N }, (_, i) => X0 + ((X1 - X0) * i) / (N - 1))

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const target = ref<TargetKey>('sine')
const units = ref(6)
const rate = ref(0.1)
const playing = ref(false)
const steps = ref(0)
const loss = ref(0)
const tick = ref(0)
const announcement = ref('')

let w: number[] = []
let b: number[] = []
let v: number[] = []
let c = 0

function init() {
  const rnd = mulberry32(42)
  w = Array.from({ length: MAX_UNITS }, () => (rnd() * 2 - 1) * 2.2)
  b = Array.from({ length: MAX_UNITS }, () => (rnd() * 2 - 1) * 2.5)
  v = Array.from({ length: MAX_UNITS }, () => (rnd() * 2 - 1) * 0.4)
  c = 0
  steps.value = 0
  measure()
}

function predict(x: number) {
  let out = c
  for (let i = 0; i < units.value; i++) out += v[i]! * Math.tanh(w[i]! * x + b[i]!)
  return out
}

function measure() {
  const f = TARGETS[target.value].f
  let sum = 0
  for (const x of xs) sum += (predict(x) - f(x)) ** 2
  if (!Number.isFinite(sum)) {
    // Safety net: if training ever blows up, start over instead of drawing NaN.
    init()
    return
  }
  loss.value = sum / N
  tick.value++
}

function step() {
  const f = TARGETS[target.value].f
  const h = units.value
  const gw = new Array(h).fill(0)
  const gb = new Array(h).fill(0)
  const gv = new Array(h).fill(0)
  let gc = 0
  for (const x of xs) {
    const t = new Array<number>(h)
    let out = c
    for (let i = 0; i < h; i++) {
      t[i] = Math.tanh(w[i]! * x + b[i]!)
      out += v[i]! * t[i]!
    }
    const err = out - f(x)
    gc += err
    for (let i = 0; i < h; i++) {
      gv[i] += err * t[i]!
      const pre = err * v[i]! * (1 - t[i]! * t[i]!)
      gw[i] += pre * x
      gb[i] += pre
    }
  }
  // The usable step size shrinks as units are added: with many saturated units the loss is
  // steeper, and a fixed rate would oscillate or diverge.
  const k = (2 * rate.value) / (N * (1 + h / 4))
  c -= k * gc
  for (let i = 0; i < h; i++) {
    v[i]! -= k * gv[i]
    w[i]! -= k * gw[i]
    b[i]! -= k * gb[i]
  }
  steps.value++
}

const uid = useId()

let raf = 0
function frame() {
  raf = 0
  if (!playing.value) return
  for (let i = 0; i < STEPS_PER_FRAME; i++) step()
  measure()
  if (steps.value >= STEP_LIMIT) {
    playing.value = false
    return
  }
  raf = requestAnimationFrame(frame)
}

watch(playing, (on, was) => {
  if (on && !raf) raf = requestAnimationFrame(frame)
  if (!on && was) {
    cancelAnimationFrame(raf)
    raf = 0
    announcement.value = `Training paused at step ${steps.value}. Mean squared error ${loss.value.toFixed(4)} with ${units.value} hidden units on the ${TARGETS[target.value].label} target.`
  }
  if (on) announcement.value = ''
})

watch([target, units], () => measure())

function reset() {
  init()
  announcement.value = 'Reset. The network is untrained again.'
}

const sx = (x: number) => PLOT.left + ((x - X0) / (X1 - X0)) * (PLOT.right - PLOT.left)
const sy = (y: number) => PLOT.mid - Math.max(-1.9, Math.min(1.9, y)) * PLOT.scale
const r1 = (n: number) => Math.round(n * 10) / 10

function curve(fn: (x: number) => number) {
  const pts: string[] = []
  const n = 160
  for (let i = 0; i <= n; i++) {
    const x = X0 + ((X1 - X0) * i) / n
    pts.push(`${i ? 'L' : 'M'}${r1(sx(x))} ${r1(sy(fn(x)))}`)
  }
  return pts.join('')
}

const targetPath = computed(() => curve(TARGETS[target.value].f))
const networkPath = computed(() => {
  void tick.value
  return curve(predict)
})
const samples = computed(() => xs.map(x => ({ cx: r1(sx(x)), cy: r1(sy(TARGETS[target.value].f(x))) })).filter((_, i) => i % 2 === 0))

const root = ref<HTMLElement>()
const reduced = ref(true)
onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Start training when the figure scrolls into view, unless the visitor prefers reduced motion.
  const io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting && !reduced.value && steps.value === 0) playing.value = true
    if (!entry?.isIntersecting && playing.value) playing.value = false
  })
  if (root.value) io.observe(root.value)
  onBeforeUnmount(() => {
    io.disconnect()
    cancelAnimationFrame(raf)
  })
})

init()
</script>

<template>
  <figure ref="root" class="demo breakout">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-labelledby="`${uid}-title ${uid}-desc`" class="plot">
      <title :id="`${uid}-title`">Function approximation plot</title>
      <desc :id="`${uid}-desc`">
        A neural network with {{ units }} hidden units fitted to the {{ TARGETS[target].label }} target.
        Current mean squared error {{ loss.toFixed(4) }} after {{ steps }} training steps.
      </desc>
      <line :x1="PLOT.left" :x2="PLOT.right" :y1="PLOT.mid" :y2="PLOT.mid" class="axis" />
      <line :x1="sx(0)" :x2="sx(0)" y1="16" :y2="H - 16" class="axis" />
      <path :d="targetPath" class="target" />
      <circle v-for="(s, i) in samples" :key="i" :cx="s.cx" :cy="s.cy" r="2.2" class="dot" />
      <path :d="networkPath" class="network" />
    </svg>

    <div class="controls">
      <label class="field">
        <span class="mono">target</span>
        <select v-model="target">
          <option v-for="(t, key) in TARGETS" :key="key" :value="key">{{ t.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="mono">hidden units <output>{{ units }}</output></span>
        <input v-model.number="units" type="range" min="1" :max="MAX_UNITS" step="1" :aria-valuetext="`${units} hidden units`" />
      </label>
      <label class="field">
        <span class="mono">learning rate <output>{{ rate.toFixed(2) }}</output></span>
        <input v-model.number="rate" type="range" min="0.01" max="0.3" step="0.01" :aria-valuetext="`learning rate ${rate.toFixed(2)}`" />
      </label>
      <div class="buttons">
        <button type="button" class="btn" :aria-pressed="playing" @click="playing = !playing">{{ playing ? 'pause' : 'train' }}</button>
        <button type="button" class="btn" @click="reset">reset</button>
      </div>
    </div>

    <figcaption class="mono muted">
      Fig. 1 — function approximation, live. Dashed line: target. Solid line: network. Dots: training samples.
      <span class="readout">step {{ steps }} · loss {{ loss.toFixed(4) }}</span>
    </figcaption>
    <p class="visually-hidden" role="status" aria-live="polite">{{ announcement }}</p>
  </figure>
</template>

<style scoped>
.demo {
  margin-inline: 0;
  padding: 1rem 0 0.75rem;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
}
.plot { display: block; width: 100%; height: auto; }
.axis { stroke: var(--line); stroke-width: 1; vector-effect: non-scaling-stroke; }
.target { fill: none; stroke: var(--muted); stroke-width: 1.5; stroke-dasharray: 5 5; vector-effect: non-scaling-stroke; }
.dot { fill: var(--muted); }
.network { fill: none; stroke: var(--accent); stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 1rem 1.5rem;
  align-items: end;
  margin-top: 0.75rem;
}
.field { display: grid; gap: 0.3rem; }
.field output { color: var(--accent); margin-left: 0.4rem; }
select, .btn {
  font: 500 0.9rem var(--font-mono);
  min-height: 2.5rem;
  padding: 0.4rem 0.7rem;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--ink);
  border-radius: 2px;
}
.buttons { display: flex; gap: 0.5rem; }
.btn { cursor: pointer; transition: background-color var(--t-fast) var(--ease-out), color var(--t-fast) var(--ease-out); }
.btn:hover { border-color: var(--accent); color: var(--accent); }
.btn[aria-pressed='true'] { background: var(--ink); color: var(--bg); }

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 24px;
  margin: 0;
  background: transparent;
}
input[type='range']::-webkit-slider-runnable-track { height: 1px; background: var(--ink); }
input[type='range']::-moz-range-track { height: 1px; background: var(--ink); }
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px; height: 24px; margin-top: -12px;
  border-radius: 50%;
  background: var(--bg);
  border: 1.5px solid var(--ink);
  transition: transform var(--t-fast) var(--ease-out), border-color var(--t-fast) var(--ease-out);
}
input[type='range']::-moz-range-thumb {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--bg);
  border: 1.5px solid var(--ink);
}
input[type='range']:hover::-webkit-slider-thumb { border-color: var(--accent); }
input[type='range']:active::-webkit-slider-thumb { transform: scale(1.15); }

figcaption { margin-top: 0.9rem; max-width: 75ch; }
.readout { display: block; margin-top: 0.25rem; color: var(--ink); }
</style>
