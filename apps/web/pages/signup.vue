<script setup lang="ts">
const form = reactive({
  firstName: 'New',
  lastName: 'Client',
  email: `new-client-${Date.now()}@tourdevino.local`,
  password: 'Password123!'
});
const errorMessage = ref('');

const { signup } = useAuth();

const submit = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    await signup(form);
    await navigateTo('/account/profile');
  } catch (error) {
    errorMessage.value = (error as Error).message;
  }
};
</script>

<template>
  <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
    <h1 class="mb-4 text-2xl font-semibold text-rose-900">Create account</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <input v-model="form.firstName" class="w-full rounded border border-slate-300 px-3 py-2" placeholder="First name" />
      <input v-model="form.lastName" class="w-full rounded border border-slate-300 px-3 py-2" placeholder="Last name" />
      <input v-model="form.email" class="w-full rounded border border-slate-300 px-3 py-2" type="email" />
      <input v-model="form.password" class="w-full rounded border border-slate-300 px-3 py-2" type="password" />
      <button class="w-full rounded bg-rose-800 px-4 py-2 font-medium text-white" type="submit">Sign up</button>
      <p v-if="errorMessage" class="text-sm text-red-700">{{ errorMessage }}</p>
    </form>
  </section>
</template>
