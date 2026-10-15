<script setup lang="ts">
// Scrollable code needs to be reachable by keyboard.
defineProps<{ code?: string; language?: string | null; filename?: string | null; highlights?: number[]; meta?: string }>()
</script>

<template>
  <pre tabindex="0" role="region" :aria-label="language ? `${language} code` : 'Code'"><slot /></pre>
</template>
