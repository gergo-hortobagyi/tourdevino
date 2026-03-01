interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiEnvelope<T> {
  data: T | null;
  meta?: Record<string, unknown>;
  error?: ApiError;
}

export interface ApiEnvelopeResult<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export async function useApi<T>(path: string, options: Parameters<typeof $fetch<ApiEnvelope<T>>>[1] = {}): Promise<T> {
  const envelope = await useApiEnvelope<T>(path, options);
  return envelope.data;
}

export async function useApiEnvelope<T>(
  path: string,
  options: Parameters<typeof $fetch<ApiEnvelope<T>>>[1] = {}
): Promise<ApiEnvelopeResult<T>> {
  const config = useRuntimeConfig();
  const authToken = useCookie<string | null>('access_token');

  const response = await $fetch<ApiEnvelope<T>>(`${config.public.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {})
    }
  });

  if (response.error) {
    throw createError({
      statusCode: 400,
      statusMessage: response.error.message,
      data: response.error
    });
  }

  if (response.data === null) {
    throw createError({ statusCode: 500, statusMessage: 'Empty response data' });
  }

  return {
    data: response.data,
    ...(response.meta ? { meta: response.meta } : {})
  };
}
