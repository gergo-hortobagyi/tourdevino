<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const dashboard = ref<Record<string, unknown> | null>(null);
const analytics = ref<Record<string, unknown> | null>(null);
const errorMessage = ref('');

try {
  dashboard.value = await useAdminDashboard();
  analytics.value = await useAdminAnalyticsOverview();
} catch {
  errorMessage.value = 'Unable to load admin dashboard.';
}
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Admin dashboard</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <div v-else-if="dashboard" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <article class="rounded border border-slate-200 p-3"><p class="text-xs uppercase text-slate-500">Users</p><p class="text-xl font-semibold">{{ dashboard.totalUsers }}</p></article>
      <article class="rounded border border-slate-200 p-3"><p class="text-xs uppercase text-slate-500">Pending vendors</p><p class="text-xl font-semibold">{{ dashboard.pendingVendors }}</p></article>
      <article class="rounded border border-slate-200 p-3"><p class="text-xs uppercase text-slate-500">Active tours</p><p class="text-xl font-semibold">{{ dashboard.activeTours }}</p></article>
      <article class="rounded border border-slate-200 p-3"><p class="text-xs uppercase text-slate-500">Paid bookings</p><p class="text-xl font-semibold">{{ dashboard.paidBookings }}</p></article>
      <article class="rounded border border-slate-200 p-3"><p class="text-xs uppercase text-slate-500">Revenue</p><p class="text-xl font-semibold">${{ ((dashboard.grossRevenueCents as number | undefined ?? 0) / 100).toFixed(2) }}</p></article>
    </div>

    <div v-if="analytics" class="rounded border border-slate-200 p-3 text-sm text-slate-700">
      <p>Users by role: {{ analytics.usersByRole }}</p>
      <p>Bookings by status: {{ analytics.bookingsByStatus }}</p>
    </div>
  </section>
</template>
