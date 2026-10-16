<script setup lang="ts">
const data = await useHomeData()

useHead({ titleTemplate: '%s' })
useSeoMeta({
  title: 'Grigory Gulyuk — software engineer, AI tooling and full-stack',
  description: 'Notes, interactive experiments and a CV by Grigory Gulyuk, a software engineer working on AI tooling and full-stack products.',
  ogTitle: 'Grigory Gulyuk',
  ogDescription: 'Notes, interactive experiments and a CV.',
  ogType: 'website',
})
</script>

<template>
  <HomeExplorer v-bind="data" />
</template>
