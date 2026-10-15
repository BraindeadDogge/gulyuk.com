<script setup lang="ts">
defineProps<{ value: 'seedling' | 'budding' | 'evergreen' | string }>()
</script>

<template>
  <span class="badge mono">
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="1.2" />
      <path v-if="value === 'budding'" d="M6 1.4a4.6 4.6 0 0 1 0 9.2z" fill="currentColor" />
      <circle v-else-if="value === 'evergreen'" cx="6" cy="6" r="4.6" fill="currentColor" />
    </svg>
    {{ value }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  color: var(--muted);
}
</style>
