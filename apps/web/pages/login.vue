<script setup lang="ts">
const email = ref('');
const password = ref('');
const errorMessage = ref('');

const { login, user } = useAuth();

const submit = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    await login(email.value, password.value);
    if (user.value?.role === 'ADMIN') {
      await navigateTo('/admin');
      return;
    }
    if (user.value?.role === 'VENDOR') {
      await navigateTo('/vendor');
      return;
    }
    await navigateTo('/account/profile');
  } catch (error) {
    errorMessage.value = (error as Error).message;
  }
};
</script>

<template>
  <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
    <h1 class="mb-4 text-2xl font-semibold text-rose-900">Login</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block" for="email">
        <span class="text-sm font-medium">Email</span>
        <input id="email" v-model="email" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" type="email" />
      </label>
      <label class="block" for="password">
        <span class="text-sm font-medium">Password</span>
        <input id="password" v-model="password" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" type="password" />
      </label>
      <button class="w-full rounded bg-rose-800 px-4 py-2 font-medium text-white" type="submit">Sign in</button>
      <p v-if="errorMessage" class="text-sm text-red-700">{{ errorMessage }}</p>
    </form>
  </section>
</template>
