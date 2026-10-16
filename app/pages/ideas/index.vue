<script setup lang="ts">
const { data: ideas } = await useIdeasIndex()
const vocab = await useVocabulary()

useSeoMeta({
  title: 'Ideas',
  description: 'Research notes, projects and interactive experiments by Grigory Gulyuk.',
})
useSchemaOrg([
  defineBreadcrumb({ itemListElement: [{ name: 'Home', item: '/' }, { name: 'Ideas' }] }),
])
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>Ideas</h1>
      <p class="muted lede">
        Research notes, projects and experiments. Newest first. The
        <NuxtLink to="/">map</NuxtLink> shows how they connect.
      </p>
    </header>
    <ul class="rows">
      <IdeaRow v-for="idea in ideas" :key="idea.slug" :idea="idea" :labels="vocab.labels" />
    </ul>
  </div>
</template>

<style scoped>
.head { padding: 2rem 0 1rem; }
.lede { max-width: 52ch; margin: 0.75rem 0 0; }
.rows { list-style: none; margin: 1rem 0 0; padding: 0; border-top: 1px solid var(--ink); max-width: 56rem; }
</style>
