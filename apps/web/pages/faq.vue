<script setup lang="ts">
const { data, status, error } = await useFaq();
</script>

<template>
  <section class="space-y-3">
    <h1 class="text-3xl font-semibold text-rose-900">FAQ</h1>
    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading FAQ...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Unable to load FAQ.</p>
    <div v-else class="space-y-2">
      <article v-for="item in data?.data" :key="item.id" class="rounded-xl bg-white p-4 shadow">
        <h2 class="font-semibold text-slate-900">{{ item.question }}</h2>
        <p class="text-sm text-slate-700">{{ item.answer }}</p>
      </article>
    </div>
  </section>
</template>
