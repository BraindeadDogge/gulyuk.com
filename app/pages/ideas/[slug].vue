<script setup lang="ts">
import { formatDate } from '~~/shared/graph/build-graph'
import { ideaTagline } from '~~/shared/og/tagline'

const route = useRoute()
const slug = String(route.params.slug)
const article = ref<HTMLElement>()
useReadingProgress(() => article.value?.querySelector<HTMLElement>('.prose') ?? null, slug)

type MinimarkNode = string | [string, Record<string, unknown>, ...unknown[]]
// An interactive essay carries a plain-text copy of itself inside its component tag, for the .md and llms.txt
// output. The page renders the component instead, so drop the copy here to keep it out of the page payload.
const withoutTextCopy = <T extends { body: { value?: unknown } }>(p: T): T => {
  const value = p.body?.value
  if (!Array.isArray(value)) return p
  // The copy's code blocks also leave a syntax-highlighting <style> node at the end of the body; it is not needed either.
  const trimmed = (value as MinimarkNode[])
    .filter(n => !(Array.isArray(n) && n[0] === 'style'))
    .map(n => (Array.isArray(n) && n[0].endsWith('-essay') ? [n[0], n[1]] : n))
  return { ...p, body: { ...p.body, value: trimmed, toc: undefined } }
}

const { data: page } = await useAsyncData(`idea-${slug}`, async () => {
  if (!canQueryContent) return null
  const found = await queryCollection('ideas').path(`/ideas/${slug}`).first()
  return found ? withoutTextCopy(found) : null
})
if (!page.value || page.value.draft) {
  throw createError({ statusCode: 404, statusMessage: 'No such idea', fatal: true })
}
const { data: index } = await useIdeasIndex()
const vocab = await useVocabulary()
const labelOf = (id: string) => vocab.value.labels[id] ?? id

const date = String(page.value.date).slice(0, 10)
const updated = page.value.updated ? String(page.value.updated).slice(0, 10) : null
const minutes = page.value.minutes ?? readingMinutes(page.value.body)

// Related: shared topics count most; sharing the area counts a little, so there is always something to show.
const related = computed(() =>
  (index.value ?? [])
    .filter(i => i.slug !== slug)
    .map(i => ({ idea: i, score: i.topics.filter(t => page.value!.topics.includes(t)).length * 2 + (i.area === page.value!.area ? 1 : 0) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
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
  articleSection: labelOf(page.value.area),
  articleTag: page.value.topics.map(labelOf),
})
// The share card for this idea, drawn at build time from OgImage/Idea.takumi.vue.
defineOgImage('Idea', {
  title: page.value.title,
  tagline: ideaTagline(page.value.tagline, page.value.summary),
  meta: [page.value.kind, page.value.maturity, `${minutes} min read`].join(' · '),
}, { alt: page.value.title })
useSchemaOrg([
  defineArticle({
    headline: page.value.title,
    description: page.value.summary,
    datePublished: date,
    dateModified: updated ?? date,
    articleSection: labelOf(page.value.area),
    keywords: page.value.topics.map(labelOf),
  }),
  defineBreadcrumb({
    itemListElement: [{ name: 'Home', item: '/' }, { name: 'Ideas', item: '/ideas' }, { name: page.value.title }],
  }),
])
</script>

<template>
  <article v-if="page" ref="article" class="page idea">
    <header class="head">
      <p class="mono muted meta">
        <NuxtLink to="/ideas" class="back">← ideas</NuxtLink>
        <span>
          <time :datetime="date">{{ formatDate(date) }}</time>
          <template v-if="updated"> · updated <time :datetime="updated">{{ formatDate(updated) }}</time></template>
          · {{ page.kind }} ·
          <NuxtLink :to="`/topics/${page.area}`" class="area">{{ labelOf(page.area) }}</NuxtLink>
          · <MaturityBadge :value="page.maturity" /> · {{ minutes }} min read
        </span>
      </p>
      <h1>{{ page.title }}</h1>
      <p class="lede">{{ page.summary }}</p>
      <ul v-if="page.topics.length" class="topics" aria-label="Topics">
        <li v-for="t in page.topics" :key="t"><NuxtLink :to="`/topics/${t}`" class="mono">{{ labelOf(t) }}</NuxtLink></li>
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
.area { color: var(--ink); }
.lede { margin: 1.25rem 0 0; font-size: 1.35rem; line-height: 1.45; font-style: italic; }
.topics { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; list-style: none; margin: 1.25rem 0 0; padding: 0; }
.topics a { text-decoration: none; color: var(--muted); }
.topics a::before { content: '#' / ''; }
.topics a:hover { color: var(--accent); }

.related { max-width: var(--measure); margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid var(--ink); }
.related ul { list-style: none; margin: 0.75rem 0 0; padding: 0; }
.related li { padding: 0.35rem 0; }
</style>
