<script setup lang="ts">
import type { AreaGroup } from '~/composables/useSiteData'
import { formatDate } from '~~/shared/graph/build-graph'

// Each idea appears exactly once, under its own area. Its topics are tags on the row, not extra sections.
defineProps<{ groups: AreaGroup[], labels: Record<string, string> }>()
</script>

<template>
  <nav class="classic" aria-label="Contents">
    <section v-for="(g, gi) in groups" :key="g.area" class="group" :style="{ '--i': gi }">
      <h2>
        <NuxtLink :to="`/topics/${g.area}`" :data-node="`topic:${g.area}`" class="glyph-hub">{{ g.label }}</NuxtLink>
        <span class="mono muted count">{{ g.ideas.length }} {{ g.ideas.length === 1 ? 'idea' : 'ideas' }}</span>
      </h2>
      <p class="about muted">{{ g.about }}</p>
      <ul class="rows">
        <li v-for="idea in g.ideas" :key="idea.slug" class="row">
          <NuxtLink :to="idea.path" :data-node="`idea:${idea.slug}`" class="title draw-link glyph-idea">{{ idea.title }}</NuxtLink>
          <span class="mono muted meta">{{ formatDate(idea.date) }} · {{ idea.kind }}</span>
          <p class="muted summary">{{ idea.summary }}</p>
          <ul v-if="idea.topics.length" class="chips" aria-label="Topics">
            <li v-for="t in idea.topics" :key="t"><NuxtLink :to="`/topics/${t}`" class="mono">{{ labels[t] ?? t }}</NuxtLink></li>
          </ul>
        </li>
      </ul>
    </section>

    <section class="group group--cv" :style="{ '--i': groups.length }">
      <h2><NuxtLink to="/cv" data-node="cv:root" class="glyph-cv">CV</NuxtLink></h2>
      <p class="about muted">Experience, education and skills.</p>
    </section>
  </nav>
</template>

<style scoped>
.classic {
  display: grid;
  gap: 2.5rem 3rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  padding: 1.5rem 0 0;
}
.group h2 {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--ink);
}
.group h2 a { text-decoration: none; }
.group h2 a:hover { text-decoration: underline; }
.count { font-weight: 400; }
.about { margin: 0.6rem 0 0; font-size: 0.95rem; line-height: 1.5; }
.group--cv { grid-column: 1 / -1; }

.rows, .chips { list-style: none; margin: 0; padding: 0; }
.row { padding: 0.9rem 0; border-bottom: 1px solid var(--line); }
.title { font: 600 1.15rem/1.3 var(--font-ui); overflow-wrap: anywhere; }
.meta { display: block; margin-top: 0.2rem; }
.summary { margin: 0.25rem 0 0; font-size: 1rem; line-height: 1.5; max-width: 52ch; }
.chips { display: flex; flex-wrap: wrap; gap: 0.15rem 0.9rem; margin-top: 0.45rem; }
.chips a { text-decoration: none; color: var(--muted); }
.chips a::before { content: '#' / ''; }
.chips a:hover { color: var(--accent); }

/* The list keeps the graph's alphabet: filled disc = area, hollow ring = idea, square = CV. */
.glyph-hub::before, .glyph-idea::before, .glyph-cv::before {
  content: '';
  display: inline-block;
  vertical-align: 0.04em;
  margin-right: 0.55rem;
}
.glyph-hub::before { width: 0.6em; height: 0.6em; border-radius: 50%; background: var(--ink); }
.glyph-idea::before { width: 0.5em; height: 0.5em; border-radius: 50%; border: 1.5px solid var(--ink); }
.glyph-cv::before { width: 0.55em; height: 0.55em; background: var(--muted); }

/* Items rise in one after another when the list is brought back from the graph. */
.explorer.is-entering .group {
  animation: rise var(--t-slow) var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@keyframes rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
</style>
