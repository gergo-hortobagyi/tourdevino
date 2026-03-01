<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  message: ''
});
const done = ref(false);
const errorMessage = ref('');

const submit = async (): Promise<void> => {
  done.value = false;
  errorMessage.value = '';
  try {
    await useContact(form);
    done.value = true;
    form.name = '';
    form.email = '';
    form.message = '';
  } catch {
    errorMessage.value = 'Unable to send message.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-3xl font-semibold text-rose-900">Contact</h1>
    <form class="space-y-3" @submit.prevent="submit">
      <input v-model="form.name" placeholder="Name" class="w-full rounded border border-slate-300 px-3 py-2" required />
      <input v-model="form.email" type="email" placeholder="Email" class="w-full rounded border border-slate-300 px-3 py-2" required />
      <textarea v-model="form.message" rows="5" placeholder="Message" class="w-full rounded border border-slate-300 px-3 py-2" required />
      <button type="submit" class="rounded bg-rose-800 px-4 py-2 text-white">Send</button>
    </form>
    <p v-if="done" class="rounded bg-emerald-50 p-3 text-emerald-700">Message sent.</p>
    <p v-if="errorMessage" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
  </section>
</template>
