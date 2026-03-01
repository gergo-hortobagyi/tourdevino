<script setup lang="ts">
const query = reactive({
  query: '',
  region: '',
  ratingMin: '',
  sort: 'newest',
  page: 1,
  pageSize: 12
});

const queryRef = computed(() => ({ ...query }));
const { data, status, error, refresh } = await useToursSearch(queryRef);

const submit = async (): Promise<void> => {
  query.page = 1;
  await refresh();
};
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-3xl font-semibold text-rose-900">Search Tours</h1>
      <p class="text-slate-600">Discover tours by region, rating, and price.</p>
    </header>

    <form class="grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-4" @submit.prevent="submit">
      <input v-model="query.query" placeholder="Keyword" class="rounded border border-slate-300 px-3 py-2" />
      <input v-model="query.region" placeholder="Region" class="rounded border border-slate-300 px-3 py-2" />
      <select v-model="query.ratingMin" class="rounded border border-slate-300 px-3 py-2">
        <option value="">Any rating</option>
        <option value="4">4+ stars</option>
        <option value="4.5">4.5+ stars</option>
      </select>
      <button type="submit" class="rounded bg-rose-800 px-3 py-2 font-medium text-white">Apply filters</button>
    </form>

    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading tours...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Unable to load tours.</p>
    <p v-else-if="!data || data.data.length === 0" class="rounded bg-slate-100 p-3 text-slate-700">No tours found.</p>

    <div v-else class="grid gap-4 md:grid-cols-2">
      <article v-for="tour in data.data" :key="tour.id" class="rounded-xl bg-white p-4 shadow">
        <p class="text-xs uppercase tracking-wide text-rose-700">{{ tour.region }}</p>
        <h2 class="text-xl font-semibold text-slate-900">{{ tour.title }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ tour.description }}</p>
        <p class="mt-2 text-sm">Rating: {{ tour.averageRating }} ({{ tour.reviewCount }})</p>
        <p class="text-sm">Price: ${{ (tour.priceCents / 100).toFixed(2) }}</p>
        <NuxtLink :to="`/tours/${tour.slug}`" class="mt-3 inline-block text-rose-800 underline">View tour</NuxtLink>
      </article>
    </div>
  </section>
</template>
