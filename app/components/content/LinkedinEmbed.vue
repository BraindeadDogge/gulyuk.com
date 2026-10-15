<script setup lang="ts">
// LinkedIn posts load only on request: nothing from LinkedIn runs until the visitor asks for it.
const props = defineProps<{ url: string; postUrl?: string; label?: string }>()
const loaded = ref(false)
const frame = ref<HTMLIFrameElement>()

// Only real LinkedIn embed addresses are accepted, so a typo in markdown can't frame another site.
const embedSrc = computed(() => {
  try {
    const u = new URL(props.url)
    return u.protocol === 'https:' && u.hostname === 'www.linkedin.com' && u.pathname.startsWith('/embed/') ? u.href : null
  } catch {
    return null
  }
})
const openUrl = computed(() => {
  try {
    const u = new URL(props.postUrl ?? '')
    return u.protocol === 'https:' && u.hostname.endsWith('linkedin.com') ? u.href : null
  } catch {
    return null
  }
})

async function load() {
  loaded.value = true
  await nextTick()
  frame.value?.focus()
}
</script>

<template>
  <figure class="embed breakout">
    <div v-if="!loaded || !embedSrc" class="placeholder">
      <p class="mono muted">This is a LinkedIn post. Loading it contacts LinkedIn, which may set cookies.</p>
      <p class="actions">
        <button v-if="embedSrc" type="button" class="btn" @click="load">Load LinkedIn post{{ props.label ? ` from ${props.label}` : '' }}</button>
        <a v-if="openUrl" :href="openUrl" rel="noopener noreferrer" class="mono">Open on LinkedIn ↗</a>
      </p>
    </div>
    <iframe
      v-else
      ref="frame"
      :src="embedSrc"
      sandbox="allow-scripts allow-same-origin allow-popups"
      title="LinkedIn post"
      width="100%"
      height="520"
      loading="lazy"
      referrerpolicy="no-referrer"
      allowfullscreen
    />
  </figure>
</template>

<style scoped>
.embed { margin-inline: 0; padding: 1rem 0; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
.placeholder p { margin: 0; }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; margin-top: 0.9rem !important; }
.btn {
  font: 500 0.9rem var(--font-mono);
  min-height: 2.5rem;
  padding: 0.5rem 0.9rem;
  color: var(--bg);
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 2px;
  cursor: pointer;
  transition: background-color var(--t-fast) var(--ease-out), border-color var(--t-fast) var(--ease-out);
}
.btn:hover { background: var(--accent); border-color: var(--accent); }
iframe { display: block; border: 0; max-width: 504px; }
</style>
