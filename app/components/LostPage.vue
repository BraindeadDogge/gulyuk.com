<script setup lang="ts">
const props = withDefaults(defineProps<{ code?: number }>(), { code: 404 })
const notFound = computed(() => props.code === 404)
</script>

<template>
  <div class="lost">
    <svg class="orphan" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <circle cx="80" cy="80" r="7" class="ring" />
      <circle cx="80" cy="80" r="26" class="halo" />
    </svg>
    <p class="label">{{ code }}</p>
    <h1>{{ notFound ? 'no edges lead here.' : 'something broke.' }}</h1>
    <p class="muted">{{ notFound ? 'This page does not exist, or it moved.' : 'Try again in a moment.' }}</p>
    <p><a href="/" class="back mono">← Back to home</a></p>
  </div>
</template>

<style scoped>
.lost { padding: 3rem 0; }
.orphan { width: 9rem; height: 9rem; margin-left: -1rem; }
.ring { fill: var(--bg); stroke: var(--ink); stroke-width: 1.5; }
.halo { fill: none; stroke: var(--edge); stroke-dasharray: 2 5; transform-origin: 80px 80px; animation: drift 14s linear infinite; }
@keyframes drift { to { transform: rotate(360deg); } }
h1 { margin: 0.5rem 0 1rem; }
.back { font-size: 1rem; }
</style>
