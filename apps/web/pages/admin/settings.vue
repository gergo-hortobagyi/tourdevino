<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const settings = reactive({
  supportEmail: '',
  bookingCancellationWindowHours: 24,
  webhookProvider: ''
});

const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  const payload = await useAdminSettings();
  settings.supportEmail = String(payload.supportEmail ?? 'support@tourdevino.local');
  settings.bookingCancellationWindowHours = Number(payload.bookingCancellationWindowHours ?? 24);
  settings.webhookProvider = String(payload.webhookProvider ?? 'stripe');
};

try {
  await load();
} catch {
  errorMessage.value = 'Unable to load settings.';
}

const save = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await useAdminUpdateSettings({ ...settings });
    successMessage.value = 'Settings updated.';
  } catch {
    errorMessage.value = 'Unable to update settings.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">System settings</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>
    <p class="text-sm text-slate-700">Manage persisted operational settings used by admin operations.</p>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="text-sm font-medium text-slate-700">Support email<input v-model="settings.supportEmail" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Cancellation window (hours)<input v-model.number="settings.bookingCancellationWindowHours" type="number" min="1" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="text-sm font-medium text-slate-700">Webhook provider<input v-model="settings.webhookProvider" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
    </div>

    <button class="rounded bg-rose-800 px-4 py-2 text-white" @click="save">Save settings</button>
  </section>
</template>
