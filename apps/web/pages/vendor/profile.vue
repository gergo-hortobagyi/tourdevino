<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const profile = ref<Record<string, unknown> | null>(null);
const form = reactive({
  companyName: '',
  description: '',
  payoutProvider: '',
  payoutAccountMasked: ''
});

const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  const data = await useVendorProfile();
  profile.value = data;
  form.companyName = String(data.companyName ?? '');
  form.description = String(data.description ?? '');
  form.payoutProvider = String(data.payoutProvider ?? '');
  form.payoutAccountMasked = String(data.payoutAccountMasked ?? '');
};

try {
  await load();
} catch {
  errorMessage.value = 'Unable to load vendor profile.';
}

const save = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    profile.value = await useUpdateVendorProfile(form);
    successMessage.value = 'Profile updated.';
  } catch {
    errorMessage.value = 'Unable to update profile.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Vendor profile</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <div v-if="profile" class="space-y-3">
      <p class="text-sm text-slate-700">Approval status: <strong>{{ profile.approvalStatus }}</strong></p>

      <label class="block text-sm font-medium text-slate-700">Company name<input v-model="form.companyName" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="block text-sm font-medium text-slate-700">Description<textarea v-model="form.description" rows="3" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="block text-sm font-medium text-slate-700">Payout provider<input v-model="form.payoutProvider" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
      <label class="block text-sm font-medium text-slate-700">Payout account masked<input v-model="form.payoutAccountMasked" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>

      <button class="rounded bg-rose-800 px-4 py-2 text-white" @click="save">Save profile</button>
    </div>
  </section>
</template>
