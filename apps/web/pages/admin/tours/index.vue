<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const tours = ref<Array<Record<string, unknown>>>([]);
const statusFilter = ref('');
const errorMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    const result = await useAdminTours({ page: 1, pageSize: 50, status: statusFilter.value || undefined });
    tours.value = result.data;
  } catch {
    errorMessage.value = 'Unable to load tours.';
  }
};

await load();

const setStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'): Promise<void> => {
  await useAdminUpdateTourStatus(id, status);
  await load();
};
</script>

<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-rose-900">Admin tours</h1>
      <NuxtLink to="/admin/tours/new" class="rounded bg-rose-800 px-3 py-2 text-sm text-white">New tour</NuxtLink>
    </header>

    <label class="text-sm font-medium text-slate-700">Status
      <select v-model="statusFilter" class="ml-2 rounded border border-slate-300 px-3 py-2" @change="load">
        <option value="">All</option>
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </label>

    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <ul class="space-y-3">
      <li v-for="tour in tours" :key="String(tour.id)" class="rounded-xl bg-white p-4 shadow">
        <p class="font-semibold">{{ tour.title }}</p>
        <p class="text-sm text-slate-600">{{ tour.region }} - {{ tour.status }}</p>
        <div class="mt-2 flex gap-2 text-sm">
          <NuxtLink :to="`/admin/tours/${tour.id}/edit`" class="text-rose-700 underline">Edit</NuxtLink>
          <button class="text-emerald-700 underline" @click="setStatus(String(tour.id), 'ACTIVE')">Activate</button>
          <button class="text-slate-700 underline" @click="setStatus(String(tour.id), 'INACTIVE')">Deactivate</button>
        </div>
      </li>
    </ul>
  </section>
</template>
