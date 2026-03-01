<script setup lang="ts">
const route = useRoute();
const id = computed(() => String(route.params.id));

const { data: tour, status, error } = await useTourDetail(id);
const { data: reviews } = await useTourReviews(id);
</script>

<template>
  <section class="space-y-6">
    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading tour detail...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Tour not found.</p>

    <template v-else-if="tour">
      <header>
        <p class="text-xs uppercase tracking-wide text-rose-700">{{ tour.region }}</p>
        <h1 class="text-3xl font-semibold text-rose-900">{{ tour.title }}</h1>
        <p class="text-slate-700">{{ tour.description }}</p>
        <p class="text-sm text-slate-600">Rating {{ tour.averageRating }} from {{ tour.reviewCount }} review(s)</p>
      </header>

      <div class="grid gap-3 sm:grid-cols-2">
        <div v-for="media in tour.media" :key="media.id" class="rounded-xl bg-white p-3 shadow">
          <p class="text-sm text-slate-500">{{ media.type }}</p>
          <p class="truncate text-sm text-slate-700">{{ media.url }}</p>
        </div>
      </div>

      <div class="rounded-xl bg-white p-4 shadow">
        <h2 class="text-xl font-semibold text-slate-900">Upcoming availability</h2>
        <ul class="mt-2 space-y-1 text-sm text-slate-700">
          <li v-for="slot in tour.availability" :key="slot.date">
            {{ new Date(slot.date).toLocaleDateString() }} - {{ slot.availableSpots }} spots left
          </li>
        </ul>
        <NuxtLink :to="`/tours/${tour.slug}/book`" class="mt-4 inline-block rounded bg-rose-800 px-4 py-2 text-white">Book this tour</NuxtLink>
      </div>

      <div class="rounded-xl bg-white p-4 shadow">
        <h2 class="text-xl font-semibold text-slate-900">Reviews</h2>
        <p v-if="!reviews || reviews.data.length === 0" class="mt-2 text-sm text-slate-600">No reviews yet.</p>
        <ul v-else class="mt-2 space-y-3">
          <li v-for="review in reviews.data" :key="review.id" class="border-b border-slate-200 pb-2 last:border-b-0">
            <p class="text-sm font-semibold">{{ review.authorName }} - {{ review.rating }}/5</p>
            <p class="text-sm text-slate-700">{{ review.comment }}</p>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
