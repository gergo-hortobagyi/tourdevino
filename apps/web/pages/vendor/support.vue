<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-vendor'] });
</script>

<template>
  <section class="space-y-4 rounded-xl bg-white p-6 shadow">
    <h1 class="text-2xl font-semibold text-rose-900">Vendor support</h1>
    <p class="text-sm text-slate-700">For payout and operational support, contact <a href="mailto:support@tourdevino.local" class="text-rose-700 underline">support@tourdevino.local</a>.</p>
    <p class="text-sm text-slate-700">FAQ: approvals are reviewed within 2 business days. Use profile page to keep payout details current.</p>
  </section>
</template>
