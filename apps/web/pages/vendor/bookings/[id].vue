<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const route = useRoute();
const id = computed(() => String(route.params.id));

const booking = ref<any>(null);
const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    booking.value = await useVendorBooking(id.value);
  } catch {
    errorMessage.value = 'Unable to load booking.';
  }
};

await load();

const updateStatus = async (status: 'COMPLETED' | 'CANCELLED'): Promise<void> => {
  successMessage.value = '';
  errorMessage.value = '';
  try {
    booking.value = await useUpdateVendorBookingStatus(id.value, status);
    successMessage.value = `Booking marked as ${status}.`;
  } catch {
    errorMessage.value = 'Unable to update booking status.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Booking detail</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <div v-if="booking" class="space-y-2 text-sm text-slate-700">
      <p>Booking: {{ booking.id }}</p>
      <p>Status: {{ booking.status }}</p>
      <p>Tour: {{ booking.tour?.title }}</p>
      <p>Customer: {{ booking.user?.email }}</p>
    </div>

    <div class="flex gap-2">
      <button class="rounded bg-emerald-700 px-3 py-2 text-white" @click="updateStatus('COMPLETED')">Mark completed</button>
      <button class="rounded bg-slate-700 px-3 py-2 text-white" @click="updateStatus('CANCELLED')">Cancel booking</button>
    </div>
  </section>
</template>
