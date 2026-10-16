<script setup lang="ts">
import type { TopicGroup } from '~/composables/useSiteData'
import { formatDate } from '~~/shared/graph/build-graph'

defineProps<{ groups: TopicGroup[] }>()
</script>

<template>
  <nav class="classic" aria-label="Contents">
    <section v-for="(g, gi) in groups" :key="g.topic" class="group" :style="{ '--i': gi }">
      <h2>
        <NuxtLink :to="`/topics/${g.topic}`" :data-node="`topic:${g.topic}`" class="glyph-hub">{{ g.label }}</NuxtLink>
        <span class="mono muted count">{{ g.ideas.length }} {{ g.ideas.length === 1 ? 'idea' : 'ideas' }}</span>
      </h2>
      <ul>
        <li v-for="idea in g.ideas" :key="idea.slug">
          <NuxtLink :to="idea.path" :data-node="`idea:${idea.slug}`" class="title draw-link glyph-idea">{{ idea.title }}</NuxtLink>
          <span class="mono muted meta">{{ formatDate(idea.date) }} · {{ idea.kind }}</span>
          <p class="muted">{{ idea.summary }}</p>
        </li>
      </ul>
    </section>

    <section class="group group--cv" :style="{ '--i': groups.length }">
      <h2><NuxtLink to="/cv" data-node="cv:root" class="glyph-cv">CV</NuxtLink></h2>
      <p class="muted">Experience, education and skills.</p>
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
.group--cv { grid-column: 1 / -1; }

/* The list keeps the graph's alphabet: filled disc = topic, hollow ring = idea, square = CV. */
.glyph-hub::before, .glyph-idea::before, .glyph-cv::before {
  content: '';
  display: inline-block;
  vertical-align: 0.04em;
  margin-right: 0.55rem;
}
.glyph-hub::before { width: 0.6em; height: 0.6em; border-radius: 50%; background: var(--ink); }
.glyph-idea::before { width: 0.5em; height: 0.5em; border-radius: 50%; border: 1.5px solid var(--ink); }
.glyph-cv::before { width: 0.55em; height: 0.55em; background: var(--muted); }
.count { font-weight: 400; }
ul { list-style: none; margin: 0; padding: 0; }
li { padding: 0.9rem 0; border-bottom: 1px solid var(--line); }
.title { font: 600 1.15rem/1.3 var(--font-ui); overflow-wrap: anywhere; }
.meta { display: block; margin-top: 0.2rem; }
li p { margin: 0.25rem 0 0; font-size: 1rem; line-height: 1.5; max-width: 52ch; }
.group > p { margin: 0.6rem 0 0; }

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
