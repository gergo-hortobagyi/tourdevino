<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const vendors = ref<Array<any>>([]);
const form = reactive({
  vendorId: '',
  title: '',
  slug: '',
  description: '',
  region: '',
  priceCents: 12000,
  durationHours: 4,
  status: 'DRAFT'
});
const errorMessage = ref('');

try {
  const vendorResult = await useAdminVendors({ approvalStatus: 'APPROVED', page: 1, pageSize: 100 });
  vendors.value = vendorResult.data;
  form.vendorId = String(vendors.value[0]?.userId ?? vendors.value[0]?.user?.id ?? '');
} catch {
  errorMessage.value = 'Unable to load vendors.';
}

const submit = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    const created = await useAdminCreateTour(form);
    await navigateTo(`/admin/tours/${String(created.id)}/edit`);
  } catch {
    errorMessage.value = 'Unable to create tour.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Create tour</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <form class="grid gap-3" @submit.prevent="submit">
      <label class="text-sm font-medium text-slate-700">Vendor
        <select v-model="form.vendorId" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option v-for="vendor in vendors" :key="String(vendor.id)" :value="String(vendor.userId ?? vendor.user?.id)">
            {{ vendor.companyName }} ({{ vendor.user?.email }})
          </option>
        </select>
      </label>
      <label class="text-sm font-medium text-slate-700">Title<input v-model="form.title" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Slug<input v-model="form.slug" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Region<input v-model="form.region" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Description<textarea v-model="form.description" rows="4" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="text-sm font-medium text-slate-700">Price cents<input v-model.number="form.priceCents" type="number" min="100" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label class="text-sm font-medium text-slate-700">Duration hours<input v-model.number="form.durationHours" type="number" min="1" max="24" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
        <label class="text-sm font-medium text-slate-700">Status<select v-model="form.status" class="mt-1 w-full rounded border border-slate-300 px-3 py-2"><option>DRAFT</option><option>ACTIVE</option><option>INACTIVE</option></select></label>
      </div>
      <button type="submit" class="rounded bg-rose-800 px-4 py-2 text-white">Create tour</button>
    </form>
  </section>
</template>
