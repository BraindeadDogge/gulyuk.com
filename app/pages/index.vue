<script setup lang="ts">
const data = await useHomeData()

useHead({ titleTemplate: '%s' })
useSeoMeta({
  title: 'Grigory Gulyuk — machine learning notes, experiments and CV',
  description: 'Notes, interactive experiments and a CV by Grigory Gulyuk, machine learning engineer and researcher.',
  ogTitle: 'Grigory Gulyuk',
  ogDescription: 'Notes, interactive experiments and a CV.',
  ogType: 'website',
})
</script>

<template>
  <HomeExplorer v-bind="data" />
</template>
