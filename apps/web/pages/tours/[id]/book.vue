<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const id = computed(() => String(route.params.id));
const { data: tour } = await useTourDetail(id);

const form = reactive({
  scheduledAt: '',
  guestCount: 2,
  specialRequests: ''
});
const bookingResult = ref<{ id: string; status: string; totalCents: number } | null>(null);
const bookingError = ref('');
const paymentStatus = ref<'IDLE' | 'PENDING' | 'FAILED' | 'SUCCEEDED'>('IDLE');
const paymentMessage = ref('');

const createPaymentIntent = async (): Promise<void> => {
  if (!bookingResult.value) {
    return;
  }
  await useCreatePaymentIntent(bookingResult.value.id);
  const status = await usePaymentStatus(bookingResult.value.id);
  paymentStatus.value = status.paymentStatus as 'PENDING' | 'FAILED' | 'SUCCEEDED';
};

const submit = async (): Promise<void> => {
  bookingError.value = '';
  bookingResult.value = null;
  paymentStatus.value = 'IDLE';
  paymentMessage.value = '';

  if (!tour.value) {
    bookingError.value = 'Tour unavailable.';
    return;
  }

  try {
    bookingResult.value = await useCreateBooking({
      tourId: tour.value.id,
      scheduledAt: form.scheduledAt,
      guestCount: form.guestCount,
      specialRequests: form.specialRequests
    });

    await createPaymentIntent();
    paymentMessage.value = 'Payment intent created. Complete payment to confirm booking.';
  } catch {
    bookingError.value = 'Unable to create booking. Check availability and try again.';
  }
};

const simulate = async (statusValue: 'succeeded' | 'failed'): Promise<void> => {
  if (!bookingResult.value) {
    return;
  }
  await useSimulatePayment(bookingResult.value.id, statusValue);
  const status = await usePaymentStatus(bookingResult.value.id);
  paymentStatus.value = status.paymentStatus as 'PENDING' | 'FAILED' | 'SUCCEEDED';

  if (paymentStatus.value === 'SUCCEEDED') {
    paymentMessage.value = 'Payment completed successfully.';
  } else if (paymentStatus.value === 'FAILED') {
    paymentMessage.value = 'Payment failed. Retry is available.';
  }
};

const retryPayment = async (): Promise<void> => {
  if (!bookingResult.value) {
    return;
  }
  await useCreatePaymentIntent(bookingResult.value.id);
  await simulate('succeeded');
};
</script>

<template>
  <section class="space-y-5 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Book Tour</h1>
    <p v-if="tour" class="text-slate-700">{{ tour.title }} - ${{ (tour.priceCents / 100).toFixed(2) }} per guest</p>
    <p class="rounded bg-amber-50 p-3 text-xs text-amber-900">Cancellation policy: free cancellation up to 24 hours before departure.</p>

    <form class="space-y-3" @submit.prevent="submit">
      <label class="block text-sm font-medium text-slate-700" for="scheduledAt">
        Scheduled date/time
        <input id="scheduledAt" v-model="form.scheduledAt" type="datetime-local" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
      </label>
      <label class="block text-sm font-medium text-slate-700" for="guestCount">
        Guest count
        <input id="guestCount" v-model.number="form.guestCount" type="number" min="1" max="20" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" required />
      </label>
      <label class="block text-sm font-medium text-slate-700" for="specialRequests">
        Special requests
        <textarea id="specialRequests" v-model="form.specialRequests" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" rows="3" />
      </label>
      <button type="submit" class="rounded bg-rose-800 px-4 py-2 text-white">Create booking</button>
    </form>

    <p v-if="bookingResult" class="rounded bg-emerald-50 p-3 text-emerald-700">Booking created: {{ bookingResult.id }} ({{ bookingResult.status }})</p>
    <p v-if="bookingError" class="rounded bg-red-50 p-3 text-red-700">{{ bookingError }}</p>

    <div v-if="bookingResult" class="rounded border border-slate-200 p-4">
      <h2 class="text-lg font-semibold text-slate-900">Payment</h2>
      <p class="text-sm text-slate-700">Status: {{ paymentStatus }}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="rounded border border-rose-700 px-2 py-1 text-xs text-rose-700" @click="simulate('failed')">Simulate payment fail</button>
        <button class="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-700" @click="simulate('succeeded')">Simulate payment success</button>
        <button v-if="paymentStatus === 'FAILED'" class="rounded bg-rose-800 px-3 py-1 text-xs text-white" @click="retryPayment">Retry payment</button>
      </div>
      <p v-if="paymentMessage" class="mt-2 text-sm text-slate-700">{{ paymentMessage }}</p>
    </div>
  </section>
</template>
