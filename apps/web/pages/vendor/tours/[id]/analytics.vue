<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const route = useRoute();
const id = computed(() => String(route.params.id));

const analytics = ref<Record<string, unknown> | null>(null);
const errorMessage = ref('');

try {
  analytics.value = await useVendorTourAnalytics(id.value);
} catch {
  errorMessage.value = 'Unable to load tour analytics.';
}
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Tour analytics</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <div v-else-if="analytics" class="space-y-2 text-sm text-slate-700">
      <p>Total revenue: ${{ ((analytics.totalRevenueCents as number | undefined ?? 0) / 100).toFixed(2) }}</p>
      <p>Total reviews: {{ analytics.totalReviews }}</p>
      <p>Average rating: {{ analytics.averageRating }}</p>
    </div>
  </section>
</template>
