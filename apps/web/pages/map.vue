<script setup lang="ts">
import { nextTick } from 'vue';

const region = ref('');
const { data, status, error, refresh } = await useToursMap(region);

const mapEl = ref<HTMLElement | null>(null);
let leafletMap: any = null;
let markersLayer: any = null;

const validMarkers = computed(() => (data.value ?? []).filter((tour) => tour.latitude !== null && tour.longitude !== null));

const initMap = async (): Promise<void> => {
  if (!import.meta.client || !mapEl.value || leafletMap) {
    return;
  }

  const L = await import('leaflet');
  await import('leaflet/dist/leaflet.css');

  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  });

  leafletMap = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([47.1625, 19.5033], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(leafletMap);

  markersLayer = L.layerGroup().addTo(leafletMap);
};

const renderMarkers = async (): Promise<void> => {
  if (!leafletMap || !markersLayer) {
    return;
  }

  const L = await import('leaflet');
  markersLayer.clearLayers();

  const bounds = L.latLngBounds([]);

  for (const tour of validMarkers.value) {
    if (tour.latitude === null || tour.longitude === null) {
      continue;
    }

    const marker = L.marker([tour.latitude, tour.longitude]).bindPopup(
      `<strong>${tour.title}</strong><br/>${tour.region}<br/><a href="/tours/${tour.slug}">Open detail</a>`
    );
    markersLayer.addLayer(marker);
    bounds.extend([tour.latitude, tour.longitude]);
  }

  if (validMarkers.value.length > 0) {
    leafletMap.fitBounds(bounds.pad(0.2));
  } else {
    leafletMap.setView([47.1625, 19.5033], 7);
  }
};

onMounted(async () => {
  await nextTick();
  await initMap();
  await renderMarkers();
});

watch(validMarkers, async () => {
  await renderMarkers();
});

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    markersLayer = null;
  }
});
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-3xl font-semibold text-rose-900">Map View</h1>
      <p class="text-slate-600">Browse tours with geographic coordinates.</p>
    </header>

    <div class="flex gap-2">
      <input v-model="region" placeholder="Filter by region" class="rounded border border-slate-300 px-3 py-2" />
      <button class="rounded bg-rose-800 px-3 py-2 text-white" @click="refresh">Refresh map</button>
    </div>

    <p v-if="status === 'pending'" class="rounded bg-amber-50 p-3 text-amber-800">Loading map markers...</p>
    <p v-else-if="error" class="rounded bg-red-50 p-3 text-red-700">Unable to load map markers.</p>
    <p v-else-if="!data || data.length === 0" class="rounded bg-slate-100 p-3 text-slate-700">No markers in this area.</p>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div ref="mapEl" class="h-[420px] w-full" />
    </div>

    <p v-if="data && data.length > 0 && validMarkers.length === 0" class="rounded bg-slate-100 p-3 text-slate-700">
      Tours found, but none have coordinates.
    </p>

    <div v-if="data && data.length > 0" class="space-y-3">
      <article v-for="tour in data" :key="tour.id" class="rounded-xl bg-white p-4 shadow">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">{{ tour.title }}</h2>
            <p class="text-sm text-slate-600">{{ tour.region }} | {{ tour.latitude }}, {{ tour.longitude }}</p>
          </div>
          <NuxtLink :to="`/tours/${tour.slug}`" class="text-rose-800 underline">Open detail</NuxtLink>
        </div>
      </article>
    </div>
  </section>
</template>
