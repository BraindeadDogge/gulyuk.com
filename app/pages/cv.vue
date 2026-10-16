<script setup lang="ts">
const { data: cv } = await useCv()
if (!cv.value) throw createError({ statusCode: 404, statusMessage: 'CV not found', fatal: true })
const vocab = await useVocabulary()

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function month(s?: string) {
  if (!s) return 'present'
  const [y, m] = s.split('-')
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y
}

useSeoMeta({
  title: 'CV',
  description: `${cv.value.profile.name}: ${cv.value.profile.headline}. Experience, education and skills.`,
})
useSchemaOrg([
  definePerson({
    name: cv.value.profile.name,
    jobTitle: cv.value.profile.headline,
    sameAs: cv.value.profile.links.map(l => l.url),
  }),
  defineBreadcrumb({ itemListElement: [{ name: 'Home', item: '/' }, { name: 'CV' }] }),
])
</script>

<template>
  <div v-if="cv" class="page cv">
    <header class="head">
      <h1>{{ cv.profile.name }}</h1>
      <p class="headline">{{ cv.profile.headline }}</p>
      <p class="mono muted contact">
        {{ cv.profile.location }}
        <template v-for="l in cv.profile.links" :key="l.url"> · <a :href="l.url" rel="me noopener">{{ l.label }}</a></template>
        <template v-if="cv.profile.email"> · <a :href="`mailto:${cv.profile.email}`">{{ cv.profile.email }}</a></template>
      </p>
      <p class="no-print"><a class="pdf mono" href="/pdf/Grigory-Gulyuk-CV.pdf" download>Download PDF ↓</a></p>
    </header>

    <section aria-labelledby="h-about" class="block">
      <h2 id="h-about" class="label">About</h2>
      <p class="summary">{{ cv.profile.summary }}</p>
    </section>

    <section id="experience" aria-labelledby="h-exp" class="block">
      <h2 id="h-exp" class="label">Experience</h2>
      <article v-for="e in cv.experience" :id="e.id" :key="e.id" class="entry">
        <p class="mono muted when">{{ month(e.start) }} — {{ month(e.end) }}</p>
        <div>
          <h3>{{ e.role }} <span class="org">· {{ e.org }}</span></h3>
          <p v-if="e.location" class="mono muted where">{{ e.location }}</p>
          <ul><li v-for="b in e.bullets" :key="b">{{ b }}</li></ul>
          <ul v-if="e.areas.length" class="tags" aria-label="Areas">
            <li v-for="a in e.areas" :key="a"><NuxtLink :to="`/topics/${a}`" class="mono">{{ vocab.labels[a] ?? a }}</NuxtLink></li>
          </ul>
        </div>
      </article>
    </section>

    <section id="education" aria-labelledby="h-edu" class="block">
      <h2 id="h-edu" class="label">Education</h2>
      <article v-for="e in cv.education" :id="e.id" :key="e.id" class="entry">
        <p class="mono muted when">{{ month(e.start) }} — {{ month(e.end) }}</p>
        <div>
          <h3>{{ e.degree }} <span class="org">· {{ e.school }}</span></h3>
          <p v-if="e.note" class="note">{{ e.note }}</p>
        </div>
      </article>
    </section>

    <section id="skills" aria-labelledby="h-skills" class="block">
      <h2 id="h-skills" class="label">Skills</h2>
      <article v-for="s in cv.skills" :id="s.id" :key="s.id" class="entry">
        <p class="mono muted when">{{ s.group }}</p>
        <p class="skill-list">{{ s.items.join(', ') }}</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.cv { max-width: 62rem; }
.head { padding: 2rem 0 1.5rem; }
.headline { margin: 0.5rem 0 0; font-size: 1.35rem; font-style: italic; }
.contact { margin: 0.75rem 0 0; }
.pdf { display: inline-block; margin-top: 0.75rem; }
.block { padding: 1.5rem 0 0.5rem; border-top: 1px solid var(--ink); margin-top: 1.5rem; }
.block > .label { margin: 0 0 1rem; }
.summary { max-width: var(--measure); margin: 0; }
.entry {
  display: grid;
  grid-template-columns: 11rem 1fr;
  gap: 0.25rem 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--line);
  scroll-margin-top: 5rem;
}
.entry:target h3 { color: var(--accent); }
.when { margin: 0.35rem 0 0; }
.where { margin: 0.15rem 0 0; }
h3 { font-size: 1.2rem; }
.org { font-weight: 400; color: var(--muted); }
.entry ul { margin: 0.6rem 0 0; padding-left: 1.1em; }
.entry li { margin-top: 0.3rem; }
.entry li::marker { color: var(--muted); }
.entry ul.tags { display: flex; gap: 0.3rem 1rem; list-style: none; padding: 0; }
.tags a { color: var(--muted); text-decoration: none; }
.tags a::before { content: '#' / ''; }
.note, .skill-list { margin: 0.35rem 0 0; }
.skill-list { margin-top: 0; }

@media (max-width: 640px) {
  .entry { grid-template-columns: 1fr; }
}
@media print {
  .cv { max-width: none; }
  .block { break-inside: avoid; }
}
</style>
