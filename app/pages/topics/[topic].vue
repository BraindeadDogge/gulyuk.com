<script setup lang="ts">
// One route for both levels of the vocabulary: an AREA (a handful, the big sections) and a TOPIC (the
// many small tags under them). Ids are unique across both, so the address alone says which it is.
const id = String(useRoute().params.topic)
const { data: ideas } = await useIdeasIndex()
const { data: cv } = await useCv()
const vocab = await useVocabulary()

const area = computed(() => vocab.value.areas.find(a => a.id === id))
const parentId = vocab.value.parentOf[id]
const label = vocab.value.labels[id]
if (!label) throw createError({ statusCode: 404, statusMessage: 'No such topic', fatal: true })

// An area page shows everything in that part of the vocabulary: ideas whose area it is, and ideas from other
// areas that use one of its topics. (The plain list on the home page still shows each idea once, under its own area.)
const mine = computed(() =>
  (ideas.value ?? []).filter(i =>
    area.value
      ? i.area === id || i.topics.some(t => vocab.value.parentOf[t] === id)
      : i.topics.includes(id),
  ),
)
// Only the topics that an idea in this area actually uses are offered as filters.
const usedTopics = computed(() =>
  (area.value?.topics ?? []).filter(t => (ideas.value ?? []).some(i => i.topics.includes(t.id))),
)
const cvItems = computed(() => {
  if (!area.value) return []
  return [
    ...(cv.value?.experience ?? []).filter(e => e.areas.includes(id)).map(e => ({ id: e.id, text: `${e.role}, ${e.org}` })),
    ...(cv.value?.skills ?? []).filter(s => s.areas.includes(id)).map(s => ({ id: s.id, text: s.group })),
  ]
})
if (!mine.value.length && !cvItems.value.length) {
  throw createError({ statusCode: 404, statusMessage: 'Nothing here yet', fatal: true })
}

const about = area.value?.about ?? vocab.value.areas.flatMap(a => a.topics).find(t => t.id === id)?.about ?? ''
useSeoMeta({ title: label, description: about ? `${about} Everything on this site about ${label}.` : `Everything on this site about ${label}.` })
useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Ideas', item: '/ideas' },
      ...(parentId ? [{ name: vocab.value.labels[parentId] ?? parentId, item: `/topics/${parentId}` }] : []),
      { name: label },
    ],
  }),
])
</script>

<template>
  <div class="page">
    <header class="head">
      <p class="label">
        <NuxtLink v-if="parentId" :to="`/topics/${parentId}`">← {{ vocab.labels[parentId] }}</NuxtLink>
        <NuxtLink v-else to="/ideas">← ideas</NuxtLink>
      </p>
      <h1>{{ label }}</h1>
      <p v-if="about" class="about">{{ about }}</p>
      <p class="muted mono count">{{ mine.length }} {{ mine.length === 1 ? 'idea' : 'ideas' }}<template v-if="cvItems.length"> · {{ cvItems.length }} on the CV</template></p>
      <ul v-if="usedTopics.length" class="filters" aria-label="Topics in this area">
        <li v-for="t in usedTopics" :key="t.id"><NuxtLink :to="`/topics/${t.id}`" class="mono">{{ t.label }}</NuxtLink></li>
      </ul>
    </header>

    <ul class="rows">
      <IdeaRow v-for="idea in mine" :key="idea.slug" :idea="idea" :labels="vocab.labels" />
    </ul>

    <section v-if="cvItems.length" class="cv-items" aria-labelledby="cv-h">
      <h2 id="cv-h" class="label">On the CV</h2>
      <ul>
        <li v-for="item in cvItems" :key="item.id"><NuxtLink :to="`/cv#${item.id}`">{{ item.text }}</NuxtLink></li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.head { padding: 2rem 0 1.25rem; }
.head h1 { margin-top: 0.75rem; }
.head .label a { text-decoration: none; }
.about { margin: 0.75rem 0 0; max-width: 52ch; font-size: 1.2rem; line-height: 1.45; font-style: italic; }
.count { margin: 0.75rem 0 0; }
.filters { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; list-style: none; margin: 1rem 0 0; padding: 0; }
.filters a { text-decoration: none; color: var(--muted); }
.filters a::before { content: '#' / ''; }
.filters a:hover { color: var(--accent); }
.rows { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--ink); max-width: 56rem; }
.cv-items { max-width: 56rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--ink); }
.cv-items ul { list-style: none; margin: 0.75rem 0 0; padding: 0; }
.cv-items li { padding: 0.3rem 0; }
</style>
