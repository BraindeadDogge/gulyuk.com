<script setup lang="ts">
const colorMode = useColorMode()
const button = ref<HTMLButtonElement>()

type ViewTransition = { ready: Promise<void>; finished: Promise<void> }

async function toggle() {
  const next = colorMode.value === 'dark' ? 'light' : 'dark'
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => ViewTransition }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce || !button.value) {
    colorMode.preference = next
    return
  }

  // The new theme grows out of the button as a circle.
  const rect = button.value.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const root = document.documentElement
  root.classList.add('theme-transition')

  const transition = doc.startViewTransition(async () => {
    colorMode.preference = next
    await nextTick()
  })
  transition.ready.then(() =>
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
    ),
  )
  transition.finished.finally(() => root.classList.remove('theme-transition'))
}
</script>

<template>
  <button ref="button" type="button" class="theme-toggle" aria-label="Toggle colour theme" title="Toggle colour theme" @click="toggle">
    <svg class="dial" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  margin: -0.25rem;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}
.dial {
  transition: transform var(--t-slow) var(--spring);
}
.theme-toggle:hover .dial { color: var(--accent); }
html.dark .dial { transform: rotate(180deg); }
</style>
