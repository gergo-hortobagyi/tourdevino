<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });

const { data, status, error, refresh } = await useMyBookings();
const paymentState = reactive<Record<string, { status: string; message: string }>>({});

const cancelBooking = async (id: string): Promise<void> => {
  try {
    await useCancelBooking(id);
    await refresh();
  } catch (cancelError) {
    const err = cancelError as { data?: { message?: string } };
    paymentState[id] = {
      status: paymentState[id]?.status ?? 'PENDING',
      message: err.data?.message ?? 'Cancellation failed.'
    };
  }
};

const refreshPaymentStatus = async (bookingId: string): Promise<void> => {
  const payment = await usePaymentStatus(bookingId);
  paymentState[bookingId] = {
    status: payment.paymentStatus,
    message: ''
  };
};

const retryPayment = async (bookingId: string): Promise<void> => {
  await useCreatePaymentIntent(bookingId);
  await refreshPaymentStatus(bookingId);
};

const simulatePayment = async (bookingId: string, statusValue: 'succeeded' | 'failed'): Promise<void> => {
  await useSimulatePayment(bookingId, statusValue);
  await refreshPaymentStatus(bookingId);
  await refresh();
};
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-3xl font-semibold text-rose-900">My Bookings</h1>

    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading bookings...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Unable to load bookings.</p>
    <p v-else-if="!data || data.data.length === 0" class="rounded bg-slate-100 p-3 text-slate-700">No bookings yet.</p>

    <div v-else class="space-y-3">
      <article v-for="booking in data.data" :key="booking.id" class="rounded-xl bg-white p-4 shadow">
        <h2 class="font-semibold text-slate-900">{{ booking.tour.title }}</h2>
        <p class="text-sm text-slate-600">Status: {{ booking.status }} | Guests: {{ booking.guestCount }}</p>
        <p class="text-sm text-slate-600">Scheduled: {{ new Date(booking.scheduledAt).toLocaleString() }}</p>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-if="booking.canCancel"
            class="rounded bg-slate-900 px-3 py-1 text-sm text-white"
            @click="cancelBooking(booking.id)"
          >
            Cancel booking
          </button>
          <p v-else class="text-xs text-amber-700">{{ booking.cancellationReason }}</p>
        </div>

        <div class="mt-3 rounded border border-slate-200 p-3">
          <p class="text-sm font-medium">Payment status: {{ paymentState[booking.id]?.status ?? 'UNKNOWN' }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button class="rounded border border-slate-400 px-2 py-1 text-xs" @click="refreshPaymentStatus(booking.id)">Refresh payment</button>
            <button class="rounded border border-rose-700 px-2 py-1 text-xs text-rose-700" @click="simulatePayment(booking.id, 'failed')">Simulate fail</button>
            <button class="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-700" @click="simulatePayment(booking.id, 'succeeded')">Simulate success</button>
            <button
              v-if="paymentState[booking.id]?.status === 'FAILED' || booking.status === 'PENDING_PAYMENT'"
              class="rounded bg-rose-800 px-2 py-1 text-xs text-white"
              @click="retryPayment(booking.id)"
            >
              Retry payment
            </button>
          </div>
          <p v-if="paymentState[booking.id]?.message" class="mt-2 text-xs text-red-700">{{ paymentState[booking.id].message }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
