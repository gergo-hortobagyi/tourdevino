<template>
  <section class="space-y-4">
    <p class="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-800">
      Phase 0-1 foundation
    </p>
    <h1 class="text-3xl font-bold text-rose-900">Secure Tour de Vino scaffold is live.</h1>
    <p class="max-w-2xl text-slate-700">
      Nuxt SSR frontend and NestJS API are wired with JWT auth, validation, and role checks.
    </p>
    <div class="flex flex-wrap gap-3">
      <NuxtLink to="/search" class="rounded bg-rose-800 px-4 py-2 text-sm font-medium text-white">Browse Tours</NuxtLink>
      <NuxtLink to="/map" class="rounded border border-rose-800 px-4 py-2 text-sm font-medium text-rose-800">Open Map</NuxtLink>
    </div>
  </section>
</template>
