<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });

const { data: reviewsData, status, error, refresh } = await useMyReviews();
const { data: bookingsData } = await useMyBookings();

const form = reactive({
  bookingId: '',
  rating: 5,
  comment: ''
});
const formError = ref('');
const formMessage = ref('');

const eligibleBookings = computed(() => {
  const completed = bookingsData.value?.data.filter((booking) => booking.status === 'COMPLETED') ?? [];
  const reviewedBookingIds = new Set((reviewsData.value?.data ?? []).map((review) => review.bookingId));
  return completed.filter((booking) => !reviewedBookingIds.has(booking.id));
});

const selectedBooking = computed(() => eligibleBookings.value.find((booking) => booking.id === form.bookingId) ?? null);

const submit = async (): Promise<void> => {
  formError.value = '';
  formMessage.value = '';
  if (!selectedBooking.value) {
    formError.value = 'Select an eligible completed booking.';
    return;
  }

  try {
    await useCreateReview({
      bookingId: selectedBooking.value.id,
      tourId: selectedBooking.value.tour.id,
      rating: form.rating,
      comment: form.comment
    });
    await refresh();
    form.bookingId = '';
    form.rating = 5;
    form.comment = '';
    formMessage.value = 'Review submitted.';
  } catch {
    formError.value = 'Unable to submit review.';
  }
};

const remove = async (id: string): Promise<void> => {
  await useDeleteReview(id);
  await refresh();
};
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-3xl font-semibold text-rose-900">My Reviews</h1>

    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading reviews...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Unable to load reviews.</p>

    <div class="rounded-xl bg-white p-4 shadow">
      <h2 class="text-lg font-semibold text-slate-900">Write a review</h2>
      <form class="mt-3 space-y-3" @submit.prevent="submit">
        <select v-model="form.bookingId" class="w-full rounded border border-slate-300 px-3 py-2">
          <option value="">Select completed booking</option>
          <option v-for="booking in eligibleBookings" :key="booking.id" :value="booking.id">
            {{ booking.tour.title }} - {{ new Date(booking.scheduledAt).toLocaleDateString() }}
          </option>
        </select>
        <input v-model.number="form.rating" type="number" min="1" max="5" class="w-full rounded border border-slate-300 px-3 py-2" />
        <textarea v-model="form.comment" rows="3" class="w-full rounded border border-slate-300 px-3 py-2" placeholder="Share your experience" />
        <button type="submit" class="rounded bg-rose-800 px-4 py-2 text-white">Submit review</button>
      </form>
      <p v-if="formError" class="mt-2 text-sm text-red-700">{{ formError }}</p>
      <p v-if="formMessage" class="mt-2 text-sm text-emerald-700">{{ formMessage }}</p>
    </div>

    <div class="space-y-3">
      <article v-for="review in reviewsData?.data ?? []" :key="review.id" class="rounded-xl bg-white p-4 shadow">
        <h3 class="font-semibold text-slate-900">{{ review.tour.title }}</h3>
        <p class="text-sm text-slate-600">Rating: {{ review.rating }}/5</p>
        <p class="text-sm text-slate-700">{{ review.comment }}</p>
        <button class="mt-2 rounded border border-slate-500 px-2 py-1 text-xs" @click="remove(review.id)">Delete</button>
      </article>
    </div>
  </section>
</template>
