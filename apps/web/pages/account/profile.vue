<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });

const { data: profile, status, error, refresh } = await useProfile();
const { logout } = useAuth();

const form = reactive({
  firstName: '',
  lastName: ''
});
const saveMessage = ref('');
const saveError = ref('');

watch(
  profile,
  (value) => {
    if (value) {
      form.firstName = value.firstName;
      form.lastName = value.lastName;
    }
  },
  { immediate: true }
);

const save = async (): Promise<void> => {
  saveMessage.value = '';
  saveError.value = '';
  try {
    await useUpdateProfile({
      firstName: form.firstName,
      lastName: form.lastName
    });
    await refresh();
    saveMessage.value = 'Profile updated.';
  } catch {
    saveError.value = 'Unable to update profile.';
  }
};
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">My profile</h1>

    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading profile...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Unable to load profile.</p>

    <div v-else-if="profile" class="space-y-3">
      <p class="text-sm text-slate-700">{{ profile.email }} ({{ profile.role }})</p>
      <label class="block text-sm font-medium text-slate-700">
        First name
        <input v-model="form.firstName" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      <label class="block text-sm font-medium text-slate-700">
        Last name
        <input v-model="form.lastName" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      <div class="flex gap-2">
        <button class="rounded bg-rose-800 px-4 py-2 text-white" @click="save">Save profile</button>
        <button class="rounded bg-slate-900 px-4 py-2 text-white" @click="logout">Logout</button>
      </div>
      <p v-if="saveMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ saveMessage }}</p>
      <p v-if="saveError" class="rounded bg-red-50 p-3 text-red-700">{{ saveError }}</p>
    </div>
  </section>
</template>
