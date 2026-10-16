<script setup lang="ts">
// The browser bar takes the colour of the site's own theme: bright by default, dark once the visitor switches.
const colorMode = useColorMode()
useHead({
  meta: [{ name: 'theme-color', content: computed(() => (colorMode.value === 'dark' ? '#141311' : '#F4F1EA')) }],
})

// One share image for every page (links shared on LinkedIn, iMessage, Slack...). Pages can still set their own text.
const image = `${useSiteConfig().url}/og-image.png`
useSeoMeta({
  ogImage: image,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Grigory Gulyuk, gulyuk.com',
  twitterCard: 'summary_large_image',
  twitterImage: image,
  twitterImageAlt: 'Grigory Gulyuk, gulyuk.com',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="page">
    <SiteHeader />
  </div>
  <main id="main-content" tabindex="-1">
    <NuxtPage />
  </main>
  <SiteFooter />
</template>
