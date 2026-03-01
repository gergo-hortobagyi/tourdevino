<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const users = ref<Array<Record<string, unknown>>>([]);
const role = ref('');
const errorMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  try {
    const result = await useAdminUsers({ page: 1, pageSize: 50, role: role.value || undefined });
    users.value = result.data;
  } catch {
    errorMessage.value = 'Unable to load users.';
  }
};

await load();
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold text-rose-900">User and role management</h1>
    <label class="text-sm font-medium text-slate-700">Role
      <select v-model="role" class="ml-2 rounded border border-slate-300 px-3 py-2" @change="load">
        <option value="">All</option>
        <option value="CLIENT">Client</option>
        <option value="VENDOR">Vendor</option>
        <option value="ADMIN">Admin</option>
      </select>
    </label>

    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>

    <ul class="space-y-3">
      <li v-for="user in users" :key="String(user.id)" class="rounded-xl bg-white p-4 shadow">
        <p class="font-semibold">{{ user.email }}</p>
        <p class="text-sm text-slate-600">{{ user.firstName }} {{ user.lastName }} - {{ user.role }} - {{ user.status }}</p>
        <NuxtLink :to="`/admin/users/${user.id}`" class="mt-2 inline-block text-sm text-rose-700 underline">Manage</NuxtLink>
      </li>
    </ul>
  </section>
</template>
