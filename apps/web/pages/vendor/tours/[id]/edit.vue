<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const route = useRoute();
const id = computed(() => String(route.params.id));

const form = reactive({
  title: '',
  slug: '',
  description: '',
  region: '',
  priceCents: 10000,
  durationHours: 4,
  status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'INACTIVE'
});

const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  const tour = await useVendorTour(id.value);
  form.title = String(tour.title ?? '');
  form.slug = String(tour.slug ?? '');
  form.description = String(tour.description ?? '');
  form.region = String(tour.region ?? '');
  form.priceCents = Number(tour.priceCents ?? 10000);
  form.durationHours = Number(tour.durationHours ?? 4);
  form.status = String(tour.status ?? 'DRAFT') as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
};

await load();

const submit = async (): Promise<void> => {
  successMessage.value = '';
  errorMessage.value = '';
  try {
    await useUpdateVendorTour(id.value, form);
    successMessage.value = 'Tour updated.';
  } catch {
    errorMessage.value = 'Unable to update tour.';
  }
};

const archiveTour = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    await useDeleteVendorTour(id.value);
    await navigateTo('/vendor/tours');
  } catch {
    errorMessage.value = 'Unable to archive tour.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Edit tour</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <form class="grid gap-3" @submit.prevent="submit">
      <label class="text-sm font-medium text-slate-700">Title<input v-model="form.title" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Slug<input v-model="form.slug" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Region<input v-model="form.region" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Description<textarea v-model="form.description" rows="4" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="text-sm font-medium text-slate-700">Price cents<input v-model.number="form.priceCents" type="number" min="100" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label class="text-sm font-medium text-slate-700">Duration hours<input v-model.number="form.durationHours" type="number" min="1" max="24" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label class="text-sm font-medium text-slate-700">Status<select v-model="form.status" class="mt-1 w-full rounded border border-slate-300 px-3 py-2"><option>DRAFT</option><option>ACTIVE</option><option>INACTIVE</option></select></label>
      </div>
      <div class="flex gap-2">
        <button type="submit" class="rounded bg-rose-800 px-4 py-2 text-white">Save</button>
        <button type="button" class="rounded bg-slate-700 px-4 py-2 text-white" @click="archiveTour">Archive</button>
      </div>
    </form>
  </section>
</template>
