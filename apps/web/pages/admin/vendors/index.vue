<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const vendors = ref<Array<any>>([]);
const status = ref('PENDING');
const errorMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    const result = await useAdminVendors({ page: 1, pageSize: 50, approvalStatus: status.value || undefined });
    vendors.value = result.data;
  } catch {
    errorMessage.value = 'Unable to load vendors.';
  }
};

await load();

const approve = async (id: string): Promise<void> => {
  await useAdminApproveVendor(id);
  await load();
};

const reject = async (id: string): Promise<void> => {
  await useAdminRejectVendor(id, 'Rejected in admin workflow');
  await load();
};
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold text-rose-900">Vendor management</h1>

    <label class="text-sm font-medium text-slate-700">Status
      <select v-model="status" class="ml-2 rounded border border-slate-300 px-3 py-2" @change="load">
        <option value="">All</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </label>

    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <ul class="space-y-3">
      <li v-for="vendor in vendors" :key="String(vendor.id)" class="rounded-xl bg-white p-4 shadow">
        <p class="font-semibold">{{ vendor.companyName }}</p>
        <p class="text-sm text-slate-600">{{ vendor.user?.email }} - {{ vendor.approvalStatus }}</p>
        <div class="mt-2 flex gap-2 text-sm">
          <NuxtLink :to="`/admin/vendors/${vendor.id}`" class="text-rose-700 underline">View</NuxtLink>
          <button class="text-emerald-700 underline" @click="approve(String(vendor.id))">Approve</button>
          <button class="text-red-700 underline" @click="reject(String(vendor.id))">Reject</button>
        </div>
      </li>
    </ul>
  </section>
</template>
