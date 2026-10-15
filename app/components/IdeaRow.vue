<script setup lang="ts">
import type { IdeaListItem } from '~/composables/useSiteData'
import { formatDate, topicLabel } from '~~/shared/graph/build-graph'

defineProps<{ idea: IdeaListItem }>()
</script>

<template>
  <li class="row">
    <p class="mono muted meta">
      <time :datetime="idea.date">{{ formatDate(idea.date) }}</time>
      · {{ idea.kind }} · <MaturityBadge :value="idea.maturity" />
    </p>
    <h2 class="title"><NuxtLink :to="idea.path">{{ idea.title }}</NuxtLink></h2>
    <p class="summary">{{ idea.summary }}</p>
    <ul class="topics" aria-label="Topics">
      <li v-for="t in idea.topics" :key="t"><NuxtLink :to="`/topics/${t}`" class="mono">{{ topicLabel(t) }}</NuxtLink></li>
    </ul>
  </li>
</template>

<style scoped>
.row {
  display: grid;
  gap: 0.35rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--line);
}
.meta { margin: 0; }
.title { font-size: 1.6rem; }
.title a { text-decoration: none; }
.title a:hover { text-decoration: underline; text-decoration-thickness: 1px; }
.summary { margin: 0; max-width: 60ch; color: var(--muted); }
.topics { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; list-style: none; margin: 0.25rem 0 0; padding: 0; }
.topics a { text-decoration: none; color: var(--muted); }
.topics a::before { content: '#'; }
.topics a:hover { color: var(--accent); }
</style>
