<script setup lang="ts">
// The browser bar takes the colour of the site's own theme: bright by default, dark once the visitor switches.
const colorMode = useColorMode()
useHead({
  meta: [{ name: 'theme-color', content: computed(() => (colorMode.value === 'dark' ? '#141311' : '#F4F1EA')) }],
})

// One share image for every page (links shared on LinkedIn, iMessage, Slack...), except idea pages, which get their own
// card drawn at build time (see ideas/[slug].vue).
const route = useRoute()
if (!/^\/ideas\/[^/]+\/?$/.test(route.path)) {
  const image = `${useSiteConfig().url}/og-image.png`
  useSeoMeta({
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'Grigory Gulyuk, gulyuk.com',
    twitterImage: image,
    twitterImageAlt: 'Grigory Gulyuk, gulyuk.com',
  })
}
useSeoMeta({ twitterCard: 'summary_large_image' })
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
