interface VendorTourInput {
  title: string;
  slug: string;
  description: string;
  region: string;
  priceCents: number;
  durationHours: number;
  latitude?: number;
  longitude?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}

interface VendorAvailabilityInput {
  entries: Array<{ date: string; capacity: number }>;
}

function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export function useVendorDashboard() {
  return useApi<Record<string, unknown>>('/vendor/dashboard');
}

export function useVendorAnalyticsOverview() {
  return useApi<Record<string, unknown>>('/vendor/analytics/overview');
}

export function useVendorProfile() {
  return useApi<Record<string, unknown>>('/vendor/profile');
}

export function useUpdateVendorProfile(input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>('/vendor/profile', {
    method: 'PATCH',
    body: input
  });
}

export function useVendorTours(query: Record<string, string | number | undefined> = {}) {
  const qs = queryString(query);
  const path = qs ? `/vendor/tours?${qs}` : '/vendor/tours';
  const config = useRuntimeConfig();
  const authToken = useCookie<string | null>('access_token');
  return $fetch<{ data: Array<Record<string, unknown>>; meta?: Record<string, unknown> }>(`${config.public.apiBaseUrl}${path}`, {
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  });
}

export function useVendorTour(id: string) {
  return useApi<Record<string, unknown>>(`/vendor/tours/${id}`);
}

export function useVendorTourAnalytics(id: string) {
  return useApi<Record<string, unknown>>(`/vendor/tours/${id}/analytics`);
}

export function useCreateVendorTour(input: VendorTourInput) {
  return useApi<Record<string, unknown>>('/vendor/tours', {
    method: 'POST',
    body: input
  });
}

export function useUpdateVendorTour(id: string, input: Partial<VendorTourInput>) {
  return useApi<Record<string, unknown>>(`/vendor/tours/${id}`, {
    method: 'PATCH',
    body: input
  });
}

export function useDeleteVendorTour(id: string) {
  return useApi<{ success: true }>(`/vendor/tours/${id}`, {
    method: 'DELETE'
  });
}

export function useUpdateVendorTourStatus(id: string, nextStatus: VendorTourInput['status']) {
  return useApi<Record<string, unknown>>(`/vendor/tours/${id}/status`, {
    method: 'PATCH',
    body: { status: nextStatus }
  });
}

export function useUpsertVendorTourAvailability(id: string, input: VendorAvailabilityInput) {
  return useApi<Array<Record<string, unknown>>>(`/vendor/tours/${id}/availability`, {
    method: 'PUT',
    body: input
  });
}

export function useVendorBookings(query: Record<string, string | number | undefined> = {}) {
  const qs = queryString(query);
  const path = qs ? `/vendor/bookings?${qs}` : '/vendor/bookings';
  const config = useRuntimeConfig();
  const authToken = useCookie<string | null>('access_token');
  return $fetch<{ data: Array<Record<string, unknown>>; meta?: Record<string, unknown> }>(`${config.public.apiBaseUrl}${path}`, {
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  });
}

export function useVendorBooking(id: string) {
  return useApi<Record<string, unknown>>(`/vendor/bookings/${id}`);
}

export function useUpdateVendorBookingStatus(id: string, nextStatus: string) {
  return useApi<Record<string, unknown>>(`/vendor/bookings/${id}/status`, {
    method: 'PATCH',
    body: { status: nextStatus }
  });
}

export function useVendorReviews() {
  return useApi<Array<Record<string, unknown>>>('/vendor/reviews');
}

export function useRespondVendorReview(id: string, comment: string) {
  return useApi<Record<string, unknown>>(`/vendor/reviews/${id}/respond`, {
    method: 'POST',
    body: { comment }
  });
}
