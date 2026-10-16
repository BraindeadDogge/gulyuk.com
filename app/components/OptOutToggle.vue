<script setup lang="ts">
import { isOptedOut, setOptedOut } from '~~/shared/analytics/gate'

const storage = () => { try { return window.localStorage } catch { return null } }
const optedOut = ref(false)
const note = ref('')

onMounted(() => { optedOut.value = isOptedOut(storage()) })

function toggle() {
  optedOut.value = !optedOut.value
  setOptedOut(storage(), optedOut.value)
  note.value = optedOut.value ? 'Your visits are no longer counted.' : 'Your visits are counted again.'
}
</script>

<template>
  <button type="button" class="linklike" @click="toggle">{{ optedOut ? 'count my visits again' : 'stop counting my visits' }}</button>
  <span class="visually-hidden" role="status">{{ note }}</span>
</template>

<style scoped>
.linklike {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  min-height: 1.5rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}
.linklike:hover { color: var(--accent); }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
