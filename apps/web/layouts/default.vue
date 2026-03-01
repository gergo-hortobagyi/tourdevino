<template>
  <div class="min-h-screen">
    <header class="border-b border-amber-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="text-xl font-semibold text-rose-900">Tour de Vino</NuxtLink>
        <nav class="flex flex-wrap gap-4 text-sm">
          <NuxtLink to="/search" class="hover:text-rose-700">Search</NuxtLink>
          <NuxtLink to="/map" class="hover:text-rose-700">Map</NuxtLink>
          <NuxtLink to="/about" class="hover:text-rose-700">About</NuxtLink>
          <NuxtLink to="/faq" class="hover:text-rose-700">FAQ</NuxtLink>
          <NuxtLink v-if="!user" to="/login" class="hover:text-rose-700">Login</NuxtLink>
          <NuxtLink v-if="!user" to="/signup" class="hover:text-rose-700">Signup</NuxtLink>
          <template v-if="user?.role === 'CLIENT'">
            <NuxtLink to="/account/profile" class="hover:text-rose-700">Account</NuxtLink>
            <NuxtLink to="/account/bookings" class="hover:text-rose-700">Bookings</NuxtLink>
            <NuxtLink to="/account/reviews" class="hover:text-rose-700">Reviews</NuxtLink>
          </template>
          <template v-if="user?.role === 'VENDOR'">
            <NuxtLink to="/vendor" class="hover:text-rose-700">Vendor</NuxtLink>
            <NuxtLink to="/vendor/tours" class="hover:text-rose-700">My Tours</NuxtLink>
            <NuxtLink to="/vendor/bookings" class="hover:text-rose-700">Vendor Bookings</NuxtLink>
          </template>
          <template v-if="user?.role === 'ADMIN'">
            <NuxtLink to="/admin" class="hover:text-rose-700">Admin</NuxtLink>
            <NuxtLink to="/admin/vendors" class="hover:text-rose-700">Vendors</NuxtLink>
            <NuxtLink to="/admin/bookings" class="hover:text-rose-700">All Bookings</NuxtLink>
          </template>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, fetchMe } = useAuth();

try {
  await fetchMe();
} catch {
  // no-op for guests
}
</script>
