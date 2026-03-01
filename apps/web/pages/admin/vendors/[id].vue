<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const route = useRoute();
const id = computed(() => String(route.params.id));

const vendor = ref<any>(null);
const errorMessage = ref('');

try {
  vendor.value = await useAdminVendor(id.value);
} catch {
  errorMessage.value = 'Unable to load vendor.';
}
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Vendor detail</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <div v-if="vendor" class="space-y-2 text-sm text-slate-700">
      <p>Company: {{ vendor.companyName }}</p>
      <p>Email: {{ vendor.user?.email }}</p>
      <p>Approval: {{ vendor.approvalStatus }}</p>
      <p>Description: {{ vendor.description }}</p>
    </div>
  </section>
</template>
