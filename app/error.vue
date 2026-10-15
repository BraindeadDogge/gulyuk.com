<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)

useHead({ title: notFound.value ? 'Not found' : 'Something broke', htmlAttrs: { lang: 'en' } })
useSeoMeta({ robots: 'noindex' })
</script>

<template>
  <div>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="page"><SiteHeader /></div>
    <main id="main-content" tabindex="-1" class="page lost">
      <svg class="orphan" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
        <circle cx="80" cy="80" r="7" class="ring" />
        <circle cx="80" cy="80" r="26" class="halo" />
      </svg>
      <p class="label">{{ error.statusCode }}</p>
      <h1>{{ notFound ? 'no edges lead here.' : 'something broke.' }}</h1>
      <p class="muted">
        {{ notFound ? 'This page does not exist, or it moved.' : 'Try again in a moment.' }}
      </p>
      <p><NuxtLink to="/" class="back mono" @click="clearError()">← Back to home</NuxtLink></p>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.lost { padding-top: 3rem; padding-bottom: 3rem; }
.orphan { width: 9rem; height: 9rem; margin-left: -1rem; }
.ring { fill: var(--bg); stroke: var(--ink); stroke-width: 1.5; }
.halo { fill: none; stroke: var(--edge); stroke-dasharray: 2 5; transform-origin: 80px 80px; animation: drift 14s linear infinite; }
@keyframes drift { to { transform: rotate(360deg); } }
h1 { margin: 0.5rem 0 1rem; }
.back { font-size: 1rem; }
</style>
