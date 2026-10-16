<script setup lang="ts">
import type { IdeaListItem } from '~/composables/useSiteData'
import { formatDate } from '~~/shared/graph/build-graph'

defineProps<{ idea: IdeaListItem, labels: Record<string, string> }>()
</script>

<template>
  <li class="row">
    <p class="mono muted meta">
      <time :datetime="idea.date">{{ formatDate(idea.date) }}</time>
      · {{ idea.kind }} ·
      <NuxtLink :to="`/topics/${idea.area}`" class="area">{{ labels[idea.area] ?? idea.area }}</NuxtLink>
      · <MaturityBadge :value="idea.maturity" />
    </p>
    <h2 class="title"><NuxtLink :to="idea.path">{{ idea.title }}</NuxtLink></h2>
    <p class="summary">{{ idea.summary }}</p>
    <ul v-if="idea.topics.length" class="topics" aria-label="Topics">
      <li v-for="t in idea.topics" :key="t"><NuxtLink :to="`/topics/${t}`" class="mono">{{ labels[t] ?? t }}</NuxtLink></li>
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
.area { color: var(--ink); }
.title { font-size: 1.6rem; }
.title a { text-decoration: none; }
.title a:hover { text-decoration: underline; text-decoration-thickness: 1px; }
.summary { margin: 0; max-width: 60ch; color: var(--muted); }
.topics { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; list-style: none; margin: 0.25rem 0 0; padding: 0; }
.topics a { text-decoration: none; color: var(--muted); }
.topics a::before { content: '#' / ''; }
.topics a:hover { color: var(--accent); }
</style>
