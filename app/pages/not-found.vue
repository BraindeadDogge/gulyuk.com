<script setup lang="ts">
// Prerendered so the static host can serve a real, titled 404 page with no JavaScript.
useSeoMeta({ title: 'Page not found', robots: 'noindex' })
</script>

<template>
  <div class="page"><LostPage :code="404" /></div>
</template>
