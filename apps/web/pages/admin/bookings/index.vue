<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const bookings = ref<Array<any>>([]);
const status = ref('');
const errorMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    const result = await useAdminBookings({ page: 1, pageSize: 50, status: status.value || undefined });
    bookings.value = result.data;
  } catch {
    errorMessage.value = 'Unable to load bookings.';
  }
};

await load();

const cancelBooking = async (id: string): Promise<void> => {
  await useAdminCancelBooking(id, 'Cancelled by admin');
  await load();
};
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold text-rose-900">Booking management</h1>

    <label class="text-sm font-medium text-slate-700">Status
      <select v-model="status" class="ml-2 rounded border border-slate-300 px-3 py-2" @change="load">
        <option value="">All</option>
        <option value="PENDING_PAYMENT">Pending</option>
        <option value="PAID">Paid</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </label>

    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <ul class="space-y-3">
      <li v-for="booking in bookings" :key="String(booking.id)" class="rounded-xl bg-white p-4 shadow">
        <p class="font-semibold">{{ booking.id }}</p>
        <p class="text-sm text-slate-600">{{ booking.tour?.title }} - {{ booking.user?.email }} - {{ booking.status }}</p>
        <div class="mt-2 flex gap-2 text-sm">
          <NuxtLink :to="`/admin/bookings/${booking.id}`" class="text-rose-700 underline">View</NuxtLink>
          <button class="text-red-700 underline" @click="cancelBooking(String(booking.id))">Cancel</button>
        </div>
      </li>
    </ul>
  </section>
</template>
