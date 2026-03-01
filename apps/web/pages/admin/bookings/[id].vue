<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const route = useRoute();
const id = computed(() => String(route.params.id));

const booking = ref<any>(null);
const refundAmount = ref<number | null>(null);
const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  booking.value = await useAdminBooking(id.value);
};

try {
  await load();
} catch {
  errorMessage.value = 'Unable to load booking.';
}

const refund = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await useAdminRefundBooking(id.value, refundAmount.value ?? undefined, 'Admin refund');
    successMessage.value = 'Refund applied.';
    await load();
  } catch {
    errorMessage.value = 'Unable to process refund.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Booking detail</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <div v-if="booking" class="space-y-2 text-sm text-slate-700">
      <p>Status: {{ booking.status }}</p>
      <p>Tour: {{ booking.tour?.title }}</p>
      <p>Customer: {{ booking.user?.email }}</p>
      <p>Total: ${{ ((booking.totalCents as number | undefined ?? 0) / 100).toFixed(2) }}</p>
    </div>

    <div class="flex items-end gap-2">
      <label class="text-sm font-medium text-slate-700">Refund amount (cents)
        <input v-model.number="refundAmount" type="number" min="1" class="mt-1 rounded border border-slate-300 px-3 py-2" />
      </label>
      <button class="rounded bg-rose-800 px-4 py-2 text-white" @click="refund">Issue refund</button>
    </div>
  </section>
</template>
