<script setup lang="ts">
const slug = ref('terms');
const { data, status, error } = await useContentPage(slug);
</script>

<template>
  <section class="space-y-3">
    <h1 class="text-3xl font-semibold text-rose-900">Terms</h1>
    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading content...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Unable to load page.</p>
    <article v-else-if="data" class="rounded-xl bg-white p-5 shadow">
      <h2 class="text-xl font-semibold text-slate-900">{{ data.title }}</h2>
      <p class="mt-2 text-slate-700">{{ data.body }}</p>
    </article>
  </section>
</template>
