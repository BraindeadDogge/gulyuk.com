<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)

useHead({ title: notFound.value ? 'Page not found' : 'Something broke', htmlAttrs: { lang: 'en' } })
useSeoMeta({ robots: 'noindex' })
</script>

<template>
  <div>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="page"><SiteHeader /></div>
    <main id="main-content" tabindex="-1" class="page">
      <LostPage :code="error.statusCode" />
    </main>
    <SiteFooter />
  </div>
</template>
