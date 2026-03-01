<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const status = ref('');
const bookings = ref<Array<any>>([]);
const errorMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    const result = await useVendorBookings({ status: status.value || undefined, page: 1, pageSize: 30 });
    bookings.value = result.data;
  } catch {
    errorMessage.value = 'Unable to load vendor bookings.';
  }
};

await load();
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold text-rose-900">Vendor bookings</h1>

    <label class="text-sm font-medium text-slate-700">
      Status
      <select v-model="status" class="ml-2 rounded border border-slate-300 px-3 py-2" @change="load">
        <option value="">All</option>
        <option value="PENDING_PAYMENT">Pending payment</option>
        <option value="PAID">Paid</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </label>

    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <ul class="space-y-3">
      <li v-for="booking in bookings" :key="String(booking.id)" class="rounded-xl bg-white p-4 shadow">
        <p class="text-sm text-slate-700">{{ booking.tour?.title }} - {{ booking.status }}</p>
        <p class="text-xs text-slate-500">{{ booking.user?.email }}</p>
        <NuxtLink :to="`/vendor/bookings/${booking.id}`" class="mt-2 inline-block text-sm text-rose-700 underline">View details</NuxtLink>
      </li>
      <li v-if="bookings.length === 0" class="rounded bg-slate-100 p-3 text-slate-700">No bookings found.</li>
    </ul>
  </section>
</template>
