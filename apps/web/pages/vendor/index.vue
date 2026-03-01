<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const dashboard = ref<Record<string, unknown> | null>(null);
const analytics = ref<Record<string, unknown> | null>(null);
const errorMessage = ref('');

try {
  dashboard.value = await useVendorDashboard();
  analytics.value = await useVendorAnalyticsOverview();
} catch {
  errorMessage.value = 'Unable to load vendor dashboard.';
}
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Vendor dashboard</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <div v-else-if="dashboard" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <article class="rounded border border-slate-200 p-3">
        <p class="text-xs uppercase text-slate-500">Active tours</p>
        <p class="text-xl font-semibold">{{ dashboard.activeTours }}</p>
      </article>
      <article class="rounded border border-slate-200 p-3">
        <p class="text-xs uppercase text-slate-500">Upcoming bookings</p>
        <p class="text-xl font-semibold">{{ dashboard.upcomingBookings }}</p>
      </article>
      <article class="rounded border border-slate-200 p-3">
        <p class="text-xs uppercase text-slate-500">Paid bookings</p>
        <p class="text-xl font-semibold">{{ dashboard.totalPaidBookings }}</p>
      </article>
      <article class="rounded border border-slate-200 p-3">
        <p class="text-xs uppercase text-slate-500">Average rating</p>
        <p class="text-xl font-semibold">{{ dashboard.averageRating }}</p>
      </article>
      <article class="rounded border border-slate-200 p-3">
        <p class="text-xs uppercase text-slate-500">Revenue</p>
        <p class="text-xl font-semibold">${{ ((analytics?.totalRevenueCents as number | undefined ?? 0) / 100).toFixed(2) }}</p>
      </article>
    </div>
  </section>
</template>
