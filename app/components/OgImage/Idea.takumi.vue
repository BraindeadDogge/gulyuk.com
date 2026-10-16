<script setup lang="ts">
// The share card for an idea (1200x630): the mark and wordmark, the title, one short line, and what kind of
// piece it is. Rendered to a PNG while the site is generated, so the layout is plain flexbox with inline styles
// (the renderer is Takumi; it does not read the site's stylesheets).
defineProps<{ title: string, tagline?: string, meta?: string }>()

const ink = '#1B1A17'
const accent = '#C2301A'
const muted = '#5b574e'
</script>

<template>
  <div
    :style="{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      background: '#F4F1EA', color: ink, padding: '72px 80px', fontFamily: 'Commit Mono',
    }"
  >
    <div :style="{ display: 'flex', alignItems: 'center' }">
      <!-- The mark from brand/mark-colour.svg, cropped to its ink box. -->
      <svg width="78" height="62" viewBox="31 50.7 194 154.6" :style="{ marginRight: '24px' }">
        <path d="M44 205.3L104.8 205.3A13 13 0 0 0 114.8 200.6L222 72A13 13 0 0 0 202 55.4L98.7 179.3L44 179.3A13 13 0 0 0 44 205.3Z" :fill="ink" />
        <circle cx="76.2" cy="138.3" r="25" :fill="accent" />
      </svg>
      <div :style="{ display: 'flex', fontSize: '34px', fontWeight: 700 }">
        gulyuk<span :style="{ color: accent }">.</span>com
      </div>
    </div>

    <div :style="{ display: 'flex', flexDirection: 'column' }">
      <div :style="{ fontSize: '58px', fontWeight: 700, lineHeight: 1.18, lineClamp: 3 }">{{ title }}</div>
      <div v-if="tagline" :style="{ marginTop: '28px', fontSize: '30px', lineHeight: 1.3, color: muted, lineClamp: 2 }">{{ tagline }}</div>
    </div>

    <div :style="{ fontSize: '26px', color: muted }">{{ meta }}</div>
  </div>
</template>
