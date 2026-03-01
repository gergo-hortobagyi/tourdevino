export function useFilters<T extends Record<string, string | number | undefined>>(initial: T) {
  const filters = reactive({ ...initial }) as T;

  const resetFilters = (): void => {
    for (const [key, value] of Object.entries(initial)) {
      filters[key as keyof T] = value as T[keyof T];
    }
  };

  return {
    filters,
    resetFilters
  };
}
