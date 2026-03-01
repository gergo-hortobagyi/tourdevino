export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export interface ApiEnvelope<T> {
  data: T | null;
  meta?: Record<string, unknown>;
  error?: ApiError;
}
