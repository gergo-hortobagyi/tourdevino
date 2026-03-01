<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const revenue = ref<Record<string, unknown> | null>(null);
const conversion = ref<Record<string, unknown> | null>(null);
const errorMessage = ref('');

try {
  revenue.value = await useAdminRevenueReport({ granularity: 'day' });
  conversion.value = await useAdminConversionReport({ granularity: 'day' });
} catch {
  errorMessage.value = 'Unable to load reports.';
}
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Analytics and reports</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <div v-else class="space-y-3 text-sm text-slate-700">
      <p>Revenue report points: {{ Array.isArray(revenue?.data) ? revenue?.data.length : 0 }}</p>
      <p>Conversion report points: {{ Array.isArray(conversion?.data) ? conversion?.data.length : 0 }}</p>
      <pre class="overflow-auto rounded bg-slate-100 p-3">{{ revenue }}</pre>
    </div>
  </section>
</template>
