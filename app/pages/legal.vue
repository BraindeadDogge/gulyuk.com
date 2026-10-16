<script setup lang="ts">
useSeoMeta({
  title: 'Legal notice',
  description: 'Who runs gulyuk.com and how to reach them.',
})
</script>

<template>
  <article class="page prose legal">
    <h1>Legal notice</h1>
    <p class="mono muted">Last updated 16 October 2026</p>

    <p>
      gulyuk.com is the personal website of Grigory Gulyuk, an individual based in Cyprus. It is a personal,
      non-commercial site: it sells nothing, carries no advertising and offers no paid services. It publishes
      writing, experiments and a CV.
    </p>

    <h2>Contact</h2>
    <p>Grigory Gulyuk, <a href="mailto:grigory.gulyuk@gmail.com">grigory.gulyuk@gmail.com</a></p>

    <h2>Hosting</h2>
    <p>The site is hosted by Railway and delivered through Cloudflare.</p>

    <h2>Content</h2>
    <p>
      What I write here reflects my own views and may be out of date; essays are marked with how finished they are.
      Links to other sites open in a new tab and are outside my control. See the
      <NuxtLink to="/privacy">privacy page</NuxtLink> for how visits are counted.
    </p>
  </article>
</template>
