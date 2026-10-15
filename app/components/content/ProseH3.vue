<script setup lang="ts">
defineProps<{ id?: string }>()
</script>

<template>
  <h3 :id="id">
    <a v-if="id" :href="`#${id}`" class="heading-anchor"><slot /></a>
    <slot v-else />
  </h3>
</template>
