interface ContentPage {
  id: string;
  slug: string;
  title: string;
  body: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const useContentPage = (slug: Ref<string>) =>
  useAsyncData(
    () => `content-${slug.value}`,
    async () => {
      const config = useRuntimeConfig();
      const response = await $fetch<{ data: ContentPage }>(`${config.public.apiBaseUrl}/content/${slug.value}`);
      return response.data;
    },
    { watch: [slug] }
  );

export const useFaq = () =>
  useAsyncData('faq', async () => {
    const config = useRuntimeConfig();
    const response = await $fetch<{ data: FaqItem[]; meta: { total: number } }>(`${config.public.apiBaseUrl}/faq`);
    return response;
  });

export const useContact = async (payload: { name: string; email: string; message: string }): Promise<void> => {
  const config = useRuntimeConfig();
  await $fetch(`${config.public.apiBaseUrl}/contact`, {
    method: 'POST',
    body: payload
  });
};
