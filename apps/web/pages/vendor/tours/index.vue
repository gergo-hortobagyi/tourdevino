<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const query = reactive({ page: 1, pageSize: 20, status: '' });
const tours = ref<Array<Record<string, unknown>>>([]);
const meta = ref<Record<string, unknown> | null>(null);
const errorMessage = ref('');

const loadTours = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    const result = await useVendorTours(query);
    tours.value = result.data;
    meta.value = result.meta ?? null;
  } catch {
    errorMessage.value = 'Unable to load tours.';
  }
};

await loadTours();
</script>

<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-rose-900">My tours</h1>
      <NuxtLink to="/vendor/tours/new" class="rounded bg-rose-800 px-3 py-2 text-sm text-white">Create tour</NuxtLink>
    </header>

    <div class="flex gap-2">
      <select v-model="query.status" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="loadTours">
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>

    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <ul v-else class="space-y-3">
      <li v-for="tour in tours" :key="String(tour.id)" class="rounded-xl bg-white p-4 shadow">
        <h2 class="text-lg font-semibold text-slate-900">{{ tour.title }}</h2>
        <p class="text-sm text-slate-600">{{ tour.region }} - {{ tour.status }}</p>
        <div class="mt-2 flex gap-3 text-sm">
          <NuxtLink :to="`/vendor/tours/${tour.id}/edit`" class="text-rose-700 underline">Edit</NuxtLink>
          <NuxtLink :to="`/vendor/tours/${tour.id}/availability`" class="text-rose-700 underline">Availability</NuxtLink>
          <NuxtLink :to="`/vendor/tours/${tour.id}/analytics`" class="text-rose-700 underline">Analytics</NuxtLink>
        </div>
      </li>
      <li v-if="tours.length === 0" class="rounded bg-slate-100 p-3 text-slate-700">No tours found.</li>
    </ul>

    <p v-if="meta" class="text-xs text-slate-500">Total: {{ meta.total }}</p>
  </section>
</template>
