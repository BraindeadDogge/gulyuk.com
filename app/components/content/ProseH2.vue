<script setup lang="ts">
defineProps<{ id?: string }>()
</script>

<template>
  <h2 :id="id">
    <a v-if="id" :href="`#${id}`" class="heading-anchor"><slot /></a>
    <slot v-else />
  </h2>
</template>
