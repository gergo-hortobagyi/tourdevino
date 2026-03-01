<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-admin'] });

const contentData = ref<Record<string, unknown> | null>(null);
const pageForm = reactive({ slug: '', title: '', body: '', published: true });
const faqForm = reactive({ question: '', answer: '', sortOrder: 0, published: true });
const errorMessage = ref('');
const successMessage = ref('');

const load = async (): Promise<void> => {
  contentData.value = await useAdminContent({ page: 1, pageSize: 50 });
};

try {
  await load();
} catch {
  errorMessage.value = 'Unable to load content.';
}

const createPage = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await useAdminCreateContent(pageForm);
    successMessage.value = 'Content page created.';
    await load();
  } catch {
    errorMessage.value = 'Unable to create content page.';
  }
};

const createFaq = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await useAdminCreateFaq(faqForm);
    successMessage.value = 'FAQ item created.';
    await load();
  } catch {
    errorMessage.value = 'Unable to create FAQ item.';
  }
};
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-semibold text-rose-900">Content management</h1>
    <p v-if="errorMessage" role="alert" class="rounded bg-red-50 p-3 text-red-700">{{ errorMessage }}</p>
    <p v-if="successMessage" class="rounded bg-emerald-50 p-3 text-emerald-700">{{ successMessage }}</p>

    <article class="rounded-xl bg-white p-6 shadow">
      <h2 class="text-lg font-semibold text-slate-900">Create content page</h2>
      <form class="mt-3 grid gap-3" @submit.prevent="createPage">
        <input v-model="pageForm.slug" placeholder="slug" required class="rounded border border-slate-300 px-3 py-2" />
        <input v-model="pageForm.title" placeholder="title" required class="rounded border border-slate-300 px-3 py-2" />
        <textarea v-model="pageForm.body" rows="4" placeholder="body" required class="rounded border border-slate-300 px-3 py-2" />
        <button class="rounded bg-rose-800 px-4 py-2 text-white">Create page</button>
      </form>
    </article>

    <article class="rounded-xl bg-white p-6 shadow">
      <h2 class="text-lg font-semibold text-slate-900">Create FAQ</h2>
      <form class="mt-3 grid gap-3" @submit.prevent="createFaq">
        <input v-model="faqForm.question" placeholder="Question" required class="rounded border border-slate-300 px-3 py-2" />
        <textarea v-model="faqForm.answer" rows="3" placeholder="Answer" required class="rounded border border-slate-300 px-3 py-2" />
        <button class="rounded bg-slate-800 px-4 py-2 text-white">Create FAQ</button>
      </form>
    </article>

    <article class="rounded-xl bg-white p-6 shadow">
      <h2 class="text-lg font-semibold text-slate-900">Current content snapshot</h2>
      <pre class="mt-3 overflow-auto rounded bg-slate-100 p-3 text-xs">{{ contentData }}</pre>
    </article>
  </section>
</template>
