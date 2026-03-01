<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const route = useRoute();
const id = computed(() => String(route.params.id));

const date = ref('');
const capacity = ref(20);
const entries = ref<Array<{ date: string; capacity: number }>>([]);
const current = ref<Array<Record<string, unknown>>>([]);
const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  const tour = await useVendorTour(id.value);
  current.value = Array.isArray(tour.availability) ? (tour.availability as Array<Record<string, unknown>>) : [];
};

await load();

const addEntry = (): void => {
  if (!date.value) {
    return;
  }
  entries.value.push({ date: `${date.value}T00:00:00.000Z`, capacity: capacity.value });
  date.value = '';
};

const save = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const result = await useUpsertVendorTourAvailability(id.value, { entries: entries.value });
    current.value = result;
    entries.value = [];
    successMessage.value = 'Availability updated.';
  } catch {
    errorMessage.value = 'Unable to update availability.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Tour availability</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <div class="grid gap-3 sm:grid-cols-3">
      <label class="text-sm font-medium text-slate-700">Date<input v-model="date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Capacity<input v-model.number="capacity" type="number" min="1" max="200" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <button class="self-end rounded bg-slate-800 px-3 py-2 text-white" @click="addEntry">Add row</button>
    </div>

    <ul class="space-y-2 text-sm">
      <li v-for="entry in entries" :key="entry.date" class="rounded border border-slate-200 p-2">
        {{ entry.date.slice(0, 10) }} - {{ entry.capacity }} seats
      </li>
    </ul>

    <button class="rounded bg-rose-800 px-4 py-2 text-white" @click="save">Save availability</button>

    <h2 class="text-lg font-semibold text-slate-900">Current availability</h2>
    <ul class="space-y-2 text-sm">
      <li v-for="entry in current" :key="String(entry.id)" class="rounded border border-slate-200 p-2">
        {{ String(entry.date).slice(0, 10) }} - {{ entry.bookedCount }} / {{ entry.capacity }} booked
      </li>
    </ul>
  </section>
</template>
