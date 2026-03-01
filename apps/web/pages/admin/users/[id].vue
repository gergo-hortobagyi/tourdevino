<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const route = useRoute();
const id = computed(() => String(route.params.id));

const user = ref<Record<string, unknown> | null>(null);
const selectedRole = ref<'CLIENT' | 'VENDOR' | 'ADMIN'>('CLIENT');
const selectedStatus = ref<'ACTIVE' | 'BANNED'>('ACTIVE');
const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  const profile = await useAdminUser(id.value);
  user.value = profile;
  selectedRole.value = String(profile.role) as 'CLIENT' | 'VENDOR' | 'ADMIN';
  selectedStatus.value = String(profile.status) as 'ACTIVE' | 'BANNED';
};

try {
  await load();
} catch {
  errorMessage.value = 'Unable to load user.';
}

const saveRole = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await useAdminUpdateUserRole(id.value, selectedRole.value);
    successMessage.value = 'Role updated.';
    await load();
  } catch {
    errorMessage.value = 'Unable to update role.';
  }
};

const saveStatus = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await useAdminUpdateUserStatus(id.value, selectedStatus.value);
    successMessage.value = 'Status updated.';
    await load();
  } catch {
    errorMessage.value = 'Unable to update status.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">User detail</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <div v-if="user" class="space-y-2 text-sm text-slate-700">
      <p>{{ user.email }}</p>
      <p>{{ user.firstName }} {{ user.lastName }}</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="text-sm font-medium text-slate-700">Role
        <select v-model="selectedRole" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="CLIENT">Client</option>
          <option value="VENDOR">Vendor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </label>
      <button class="self-end rounded bg-rose-800 px-4 py-2 text-white" @click="saveRole">Update role</button>

      <label class="text-sm font-medium text-slate-700">Status
        <select v-model="selectedStatus" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="ACTIVE">Active</option>
          <option value="BANNED">Banned</option>
        </select>
      </label>
      <button class="self-end rounded bg-slate-700 px-4 py-2 text-white" @click="saveStatus">Update status</button>
    </div>
  </section>
</template>
