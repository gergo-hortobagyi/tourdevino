<script setup lang="ts">
const form = reactive({
  token: '',
  newPassword: 'Password123!'
});
const message = ref('');

const submit = async (): Promise<void> => {
  message.value = '';
  try {
    await useApi<{ success: true }>('/auth/reset-password', {
      method: 'POST',
      body: form
    });
    message.value = 'Password reset request submitted.';
  } catch {
    message.value = 'Unable to reset password.';
  }
};
</script>

<template>
  <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
    <h1 class="mb-4 text-2xl font-semibold text-rose-900">Reset password</h1>
    <form class="space-y-3" @submit.prevent="submit">
      <input v-model="form.token" placeholder="Reset token" class="w-full rounded border border-slate-300 px-3 py-2" />
      <input v-model="form.newPassword" type="password" class="w-full rounded border border-slate-300 px-3 py-2" />
      <button type="submit" class="w-full rounded bg-rose-800 px-4 py-2 text-white">Reset</button>
    </form>
    <p v-if="message" class="mt-3 text-sm text-slate-700">{{ message }}</p>
  </section>
</template>
