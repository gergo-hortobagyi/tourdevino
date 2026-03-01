<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });

const reviews = ref<Array<any>>([]);
const draft = reactive<Record<string, string>>({});
const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  errorMessage.value = '';
  reviews.value = await useVendorReviews();
};

try {
  await load();
} catch {
  errorMessage.value = 'Unable to load reviews.';
}

const respond = async (id: string): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await useRespondVendorReview(id, draft[id] ?? 'Thank you for your feedback.');
    successMessage.value = 'Response saved.';
    await load();
  } catch {
    errorMessage.value = 'Unable to save response.';
  }
};
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold text-rose-900">Review management</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <ul class="space-y-3">
      <li v-for="review in reviews" :key="String(review.id)" class="rounded-xl bg-white p-4 shadow">
        <p class="text-sm text-slate-700">{{ review.tour?.title }} - {{ review.rating }}/5</p>
        <p class="text-xs text-slate-500">{{ review.user?.firstName }} {{ review.user?.lastName }}</p>
        <p class="mt-2 text-sm">{{ review.comment }}</p>

        <textarea
          v-model="draft[String(review.id)]"
          rows="2"
          class="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Write your response"
        />
        <button class="mt-2 rounded bg-rose-800 px-3 py-2 text-sm text-white" @click="respond(String(review.id))">Save response</button>
      </li>
      <li v-if="reviews.length === 0" class="rounded bg-slate-100 p-3 text-slate-700">No reviews yet.</li>
    </ul>
  </section>
</template>
