<script setup lang="ts">
import { formatDate, topicLabel } from '~~/shared/graph/build-graph'

const route = useRoute()
const slug = String(route.params.slug)

const { data: page } = await useAsyncData(`idea-${slug}`, async () =>
  canQueryContent ? await queryCollection('ideas').path(`/ideas/${slug}`).first() : null,
)
if (!page.value || page.value.draft) {
  throw createError({ statusCode: 404, statusMessage: 'No such idea', fatal: true })
}
const { data: index } = await useIdeasIndex()

const date = String(page.value.date).slice(0, 10)
const updated = page.value.updated ? String(page.value.updated).slice(0, 10) : null
const minutes = readingMinutes(page.value.body)

const related = computed(() =>
  (index.value ?? [])
    .filter(i => i.slug !== slug)
    .map(i => ({ idea: i, shared: i.topics.filter(t => page.value!.topics.includes(t)).length }))
    .filter(r => r.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 4)
    .map(r => r.idea),
)

useSeoMeta({
  title: page.value.title,
  description: page.value.summary,
  ogTitle: page.value.title,
  ogDescription: page.value.summary,
  ogType: 'article',
  articlePublishedTime: date,
  articleModifiedTime: updated ?? date,
  articleTag: page.value.topics,
})
useSchemaOrg([
  defineArticle({
    headline: page.value.title,
    description: page.value.summary,
    datePublished: date,
    dateModified: updated ?? date,
    keywords: page.value.topics,
  }),
  defineBreadcrumb({
    itemListElement: [{ name: 'Home', item: '/' }, { name: 'Ideas', item: '/ideas' }, { name: page.value.title }],
  }),
])
</script>

<template>
  <article v-if="page" class="page idea">
    <header class="head">
      <p class="mono muted meta">
        <NuxtLink to="/ideas" class="back">← ideas</NuxtLink>
        <span>
          <time :datetime="date">{{ formatDate(date) }}</time>
          <template v-if="updated"> · updated <time :datetime="updated">{{ formatDate(updated) }}</time></template>
          · {{ page.kind }} · <MaturityBadge :value="page.maturity" /> · {{ minutes }} min read
        </span>
      </p>
      <h1>{{ page.title }}</h1>
      <p class="lede">{{ page.summary }}</p>
      <ul class="topics" aria-label="Topics">
        <li v-for="t in page.topics" :key="t"><NuxtLink :to="`/topics/${t}`" class="mono">{{ topicLabel(t) }}</NuxtLink></li>
      </ul>
    </header>

    <ContentRenderer :value="page" class="prose" />

    <aside v-if="related.length" class="related" aria-labelledby="related-h">
      <h2 id="related-h" class="label">Related</h2>
      <ul>
        <li v-for="r in related" :key="r.slug">
          <NuxtLink :to="r.path">{{ r.title }}</NuxtLink>
          <span class="mono muted"> · {{ formatDate(r.date) }}</span>
        </li>
      </ul>
    </aside>
  </article>
</template>

<style scoped>
.head { padding: 2rem 0 2.5rem; max-width: var(--measure); }
.meta { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; margin: 0 0 1.25rem; }
.back { text-decoration: none; }
.lede { margin: 1.25rem 0 0; font-size: 1.35rem; line-height: 1.45; font-style: italic; }
.topics { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; list-style: none; margin: 1.25rem 0 0; padding: 0; }
.topics a { text-decoration: none; color: var(--muted); }
.topics a::before { content: '#'; }
.topics a:hover { color: var(--accent); }

.related { max-width: var(--measure); margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid var(--ink); }
.related ul { list-style: none; margin: 0.75rem 0 0; padding: 0; }
.related li { padding: 0.35rem 0; }
</style>
