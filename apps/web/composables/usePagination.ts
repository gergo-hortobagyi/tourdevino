export function usePagination(initialPage = 1, initialPageSize = 20) {
  const page = ref(initialPage);
  const pageSize = ref(initialPageSize);

  const offset = computed(() => (page.value - 1) * pageSize.value);

  const nextPage = (): void => {
    page.value += 1;
  };

  const previousPage = (): void => {
    page.value = Math.max(1, page.value - 1);
  };

  const reset = (): void => {
    page.value = 1;
  };

  return {
    page,
    pageSize,
    offset,
    nextPage,
    previousPage,
    reset
  };
}
