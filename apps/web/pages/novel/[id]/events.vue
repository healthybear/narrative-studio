<script setup lang="ts">
const route = useRoute()

definePageMeta({
  layout: 'novel',
})
</script>

<template>
  <EventWorkspace :novel-id="route.params.id as string" />
</template>
