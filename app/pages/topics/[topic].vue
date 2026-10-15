<script setup lang="ts">
import { topicLabel } from '~~/shared/graph/build-graph'

const topic = String(useRoute().params.topic)
const { data: ideas } = await useIdeasIndex()
const { data: cv } = await useCv()

const mine = computed(() => (ideas.value ?? []).filter(i => i.topics.includes(topic)))
const cvItems = computed(() => [
  ...(cv.value?.experience ?? []).filter(e => e.topics.includes(topic)).map(e => ({ id: e.id, text: `${e.role}, ${e.org}` })),
  ...(cv.value?.skills ?? []).filter(s => s.topics.includes(topic)).map(s => ({ id: s.id, text: s.group })),
])
if (!mine.value.length && !cvItems.value.length) {
  throw createError({ statusCode: 404, statusMessage: 'No such topic', fatal: true })
}

const label = topicLabel(topic)
useSeoMeta({ title: `#${label}`, description: `Everything on this site tagged ${label}.` })
useSchemaOrg([
  defineBreadcrumb({ itemListElement: [{ name: 'Home', item: '/' }, { name: 'Ideas', item: '/ideas' }, { name: label }] }),
])
</script>

<template>
  <div class="page">
    <header class="head">
      <p class="label"><NuxtLink to="/ideas">← ideas</NuxtLink></p>
      <h1>{{ label }}</h1>
      <p class="muted mono">{{ mine.length }} {{ mine.length === 1 ? 'idea' : 'ideas' }}<template v-if="cvItems.length"> · {{ cvItems.length }} on the CV</template></p>
    </header>

    <ul class="rows">
      <IdeaRow v-for="idea in mine" :key="idea.slug" :idea="idea" />
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
.head p.mono { margin: 0.75rem 0 0; }
.rows { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--ink); max-width: 56rem; }
.cv-items { max-width: 56rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--ink); }
.cv-items ul { list-style: none; margin: 0.75rem 0 0; padding: 0; }
.cv-items li { padding: 0.3rem 0; }
</style>
